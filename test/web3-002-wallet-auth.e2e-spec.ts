import request from 'supertest';
import { Wallet } from 'ethers';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createTestApp, cleanDatabase, closeTestApp, E2eContext } from './e2e-setup';
import { Fixtures } from './fixtures';
import { UserRole } from 'src/users/entities/user.entity';
import { WalletNonce } from 'src/wallet-auth/entities/wallet-nonce.entity';

const BASE = '/api/v1/wallet-auth';

describe('WEB3-002 — Firma de wallet con nonce (SIWE) (e2e)', () => {
  let ctx: E2eContext;
  let fixtures: Fixtures;
  let nonceRepo: Repository<WalletNonce>;
  const server = () => ctx.app.getHttpServer();

  beforeAll(async () => {
    ctx = await createTestApp();
    fixtures = new Fixtures(ctx.app);
    nonceRepo = ctx.app.get(getRepositoryToken(WalletNonce));
  });

  afterEach(async () => {
    await cleanDatabase(ctx.dataSource);
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  async function requestNonce(address: string, chainId = 1) {
    const res = await request(server())
      .post(`${BASE}/nonce`)
      .send({ walletAddress: address, chainId });
    return res;
  }

  async function requestLinkNonce(address: string, auth: { Authorization: string }, chainId = 1) {
    const res = await request(server())
      .post(`${BASE}/link/nonce`)
      .set(auth)
      .send({ walletAddress: address, chainId });
    return res;
  }

  describe('CA1 — nonce único y con expiración', () => {
    it('emite un mensaje SIWE con nonce y expirationTime', async () => {
      const wallet = Wallet.createRandom();

      const res = await requestNonce(wallet.address);

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('wants you to sign in');
      expect(res.body.message).toContain('Nonce:');
      expect(res.body.message).toContain('Expiration Time:');
      expect(res.body.nonce).toMatch(/^0x[0-9a-f]{64}$/);

      const saved = await nonceRepo.findOne({ where: { nonce: res.body.nonce } });
      expect(saved).not.toBeNull();
      expect(saved!.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(saved!.usedAt).toBeNull();
    });

    it('cada intento usa un nonce distinto', async () => {
      const wallet = Wallet.createRandom();

      const first = await requestNonce(wallet.address);
      const second = await requestNonce(wallet.address);

      expect(first.body.nonce).not.toBe(second.body.nonce);
    });
  });

  describe('CA2/CA4 — login con wallet y sesión vinculada a la wallet validada', () => {
    it('verifica la firma, crea la sesión y devuelve la cookie HttpOnly', async () => {
      const wallet = Wallet.createRandom();
      const nonceRes = await requestNonce(wallet.address);
      const signature = await wallet.signMessage(nonceRes.body.message);

      const res = await request(server())
        .post(`${BASE}/verify`)
        .send({ message: nonceRes.body.message, signature });

      expect(res.status).toBe(200);
      expect(res.body.user.cryptoWallet).toBe(wallet.address.toLowerCase());
      expect(res.body.user.provider).toBe('wallet');
      expect(res.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('colibri_access_token=')]),
      );
      expect((res.headers['set-cookie'] as unknown as string[]).join(';')).toContain('HttpOnly');
    });
  });

  describe('CA3 — el nonce no puede reutilizarse', () => {
    it('rechaza reutilizar una firma ya consumida', async () => {
      const wallet = Wallet.createRandom();
      const nonceRes = await requestNonce(wallet.address);
      const signature = await wallet.signMessage(nonceRes.body.message);

      const first = await request(server())
        .post(`${BASE}/verify`)
        .send({ message: nonceRes.body.message, signature });
      expect(first.status).toBe(200);

      const second = await request(server())
        .post(`${BASE}/verify`)
        .send({ message: nonceRes.body.message, signature });
      expect(second.status).toBe(401);
    });

    it('solo una de dos verificaciones simultáneas del mismo nonce prospera', async () => {
      const wallet = Wallet.createRandom();
      const nonceRes = await requestNonce(wallet.address);
      const signature = await wallet.signMessage(nonceRes.body.message);

      const [a, b] = await Promise.all([
        request(server())
          .post(`${BASE}/verify`)
          .send({ message: nonceRes.body.message, signature }),
        request(server())
          .post(`${BASE}/verify`)
          .send({ message: nonceRes.body.message, signature }),
      ]);

      const statuses = [a.status, b.status].sort();
      expect(statuses).toEqual([200, 401]);
    });
  });

  describe('Pruebas negativas del ticket', () => {
    it('rechaza firmar un nonce expirado', async () => {
      const wallet = Wallet.createRandom();
      const nonceRes = await requestNonce(wallet.address);
      const signature = await wallet.signMessage(nonceRes.body.message);

      await nonceRepo.update(
        { nonce: nonceRes.body.nonce },
        { expiresAt: new Date(Date.now() - 60_000) },
      );

      const res = await request(server())
        .post(`${BASE}/verify`)
        .send({ message: nonceRes.body.message, signature });

      expect(res.status).toBe(401);
    });

    it('rechaza una firma realizada por otra wallet', async () => {
      const wallet = Wallet.createRandom();
      const attacker = Wallet.createRandom();
      const nonceRes = await requestNonce(wallet.address);
      const signature = await attacker.signMessage(nonceRes.body.message);

      const res = await request(server())
        .post(`${BASE}/verify`)
        .send({ message: nonceRes.body.message, signature });

      expect(res.status).toBe(401);
    });

    it('rechaza un mensaje manipulado (nonce alterado)', async () => {
      const wallet = Wallet.createRandom();
      const nonceRes = await requestNonce(wallet.address);
      const tampered = nonceRes.body.message.replace(nonceRes.body.nonce, '0x' + 'ab'.repeat(32));
      const signature = await wallet.signMessage(tampered);

      const res = await request(server())
        .post(`${BASE}/verify`)
        .send({ message: tampered, signature });

      expect(res.status).toBe(401);
    });

    it('rechaza un mensaje con dominio manipulado', async () => {
      const wallet = Wallet.createRandom();
      const nonceRes = await requestNonce(wallet.address);
      const tampered = nonceRes.body.message.replace('localhost:3000', 'evil.example.com');
      const signature = await wallet.signMessage(tampered);

      const res = await request(server())
        .post(`${BASE}/verify`)
        .send({ message: tampered, signature });

      expect(res.status).toBe(401);
    });

    it('rechaza una chainId no permitida', async () => {
      const wallet = Wallet.createRandom();

      const res = await requestNonce(wallet.address, 999999);

      expect(res.status).toBe(400);
    });
  });

  describe('Cruce de flujos login/link', () => {
    it('rechaza un nonce de login usado en /link/verify', async () => {
      const user = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const wallet = Wallet.createRandom();
      const nonceRes = await requestNonce(wallet.address);
      const signature = await wallet.signMessage(nonceRes.body.message);

      const res = await request(server())
        .post(`${BASE}/link/verify`)
        .set(fixtures.authHeader(user))
        .send({ message: nonceRes.body.message, signature });

      expect(res.status).toBe(401);
    });

    it('rechaza un nonce de link usado en /verify de login', async () => {
      const user = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const wallet = Wallet.createRandom();
      const nonceRes = await requestLinkNonce(wallet.address, fixtures.authHeader(user));
      const signature = await wallet.signMessage(nonceRes.body.message);

      const res = await request(server())
        .post(`${BASE}/verify`)
        .send({ message: nonceRes.body.message, signature });

      expect(res.status).toBe(401);
    });

    it('rechaza un nonce de link del usuario A usado por el usuario B', async () => {
      const userA = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const userB = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const wallet = Wallet.createRandom();
      const nonceRes = await requestLinkNonce(wallet.address, fixtures.authHeader(userA));
      const signature = await wallet.signMessage(nonceRes.body.message);

      const res = await request(server())
        .post(`${BASE}/link/verify`)
        .set(fixtures.authHeader(userB))
        .send({ message: nonceRes.body.message, signature });

      expect(res.status).toBe(401);
    });
  });

  describe('Vinculación y desvinculación', () => {
    it('vincula una wallet a la sesión autenticada', async () => {
      const user = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const wallet = Wallet.createRandom();
      const nonceRes = await requestLinkNonce(wallet.address, fixtures.authHeader(user));
      const signature = await wallet.signMessage(nonceRes.body.message);

      const res = await request(server())
        .post(`${BASE}/link/verify`)
        .set(fixtures.authHeader(user))
        .send({ message: nonceRes.body.message, signature });

      expect(res.status).toBe(200);
      expect(res.body.user.cryptoWallet).toBe(wallet.address.toLowerCase());

      const profile = await request(server())
        .get('/api/v1/users/profile')
        .set(fixtures.authHeader(user));
      expect(profile.status).toBe(200);
      expect(profile.body.cryptoWallet).toBe(wallet.address.toLowerCase());
    });

    it('rechaza vincular la misma wallet al mismo usuario (idempotencia explícita)', async () => {
      const user = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const wallet = Wallet.createRandom();

      const first = await requestLinkNonce(wallet.address, fixtures.authHeader(user));
      const firstSig = await wallet.signMessage(first.body.message);
      await request(server())
        .post(`${BASE}/link/verify`)
        .set(fixtures.authHeader(user))
        .send({ message: first.body.message, signature: firstSig })
        .expect(200);

      const second = await requestLinkNonce(wallet.address, fixtures.authHeader(user));
      const secondSig = await wallet.signMessage(second.body.message);
      const res = await request(server())
        .post(`${BASE}/link/verify`)
        .set(fixtures.authHeader(user))
        .send({ message: second.body.message, signature: secondSig });

      expect(res.status).toBe(400);
    });

    it('rechaza vincular una wallet ya vinculada a otra cuenta (409)', async () => {
      const userA = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const userB = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const wallet = Wallet.createRandom();

      const nonceA = await requestLinkNonce(wallet.address, fixtures.authHeader(userA));
      const sigA = await wallet.signMessage(nonceA.body.message);
      await request(server())
        .post(`${BASE}/link/verify`)
        .set(fixtures.authHeader(userA))
        .send({ message: nonceA.body.message, signature: sigA })
        .expect(200);

      const nonceB = await requestLinkNonce(wallet.address, fixtures.authHeader(userB));
      const sigB = await wallet.signMessage(nonceB.body.message);
      const res = await request(server())
        .post(`${BASE}/link/verify`)
        .set(fixtures.authHeader(userB))
        .send({ message: nonceB.body.message, signature: sigB });

      expect(res.status).toBe(409);
    });

    it('rechaza desvincular cuando no hay wallet vinculada', async () => {
      const user = await fixtures.createUser(UserRole.ENTREPRENEUR);

      const res = await request(server()).delete(`${BASE}/unlink`).set(fixtures.authHeader(user));

      expect(res.status).toBe(400);
    });

    it('desvincula la wallet del usuario y revoca la sesión previa', async () => {
      const user = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const wallet = Wallet.createRandom();
      const nonceRes = await requestLinkNonce(wallet.address, fixtures.authHeader(user));
      const signature = await wallet.signMessage(nonceRes.body.message);
      await request(server())
        .post(`${BASE}/link/verify`)
        .set(fixtures.authHeader(user))
        .send({ message: nonceRes.body.message, signature })
        .expect(200);

      const res = await request(server()).delete(`${BASE}/unlink`).set(fixtures.authHeader(user));

      expect(res.status).toBe(200);

      const revoked = await request(server())
        .get('/api/v1/users/profile')
        .set(fixtures.authHeader(user));

      expect(revoked.status).toBe(401);
    });
  });
});
