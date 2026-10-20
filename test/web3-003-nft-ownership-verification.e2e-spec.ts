// test/web3-003-nft-ownership-verification.e2e-spec.ts
//
// WEB3-003 — la aplicación debe demostrar que la wallet de la sesión posee
// realmente el NFT indicado, leyendo `ownerOf(uint256)` contra la red y
// contrato configurados, y registrando chainId/contrato/tokenId/bloque/
// timestamp. Una wallet sin el activo recibe un resultado negativo y los
// errores RPC NUNCA se presentan como verificación correcta.
//
// A diferencia de otros e2e de NFT, aquí NO se reemplaza BlockchainRpcService:
// se usa el servicio real y se mockea `global.fetch`, para ejercitar de verdad
// la clasificación revert (respuesta válida) vs. fallo de infraestructura
// (p.ej. {-32000, "header not found"} → 503, no invalid).

import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { AppModule } from '../src/app.module';
import { Fixtures } from './fixtures';
import { cleanDatabase } from './e2e-setup';
import { User, UserRole } from 'src/users/entities/user.entity';
import { NftProject } from 'src/nfts/entities/nft-project.entity';
import { NftOwnershipVerification } from 'src/nfts/entities/nft-ownership-verification.entity';

// chainId 137 ya está en BLOCKCHAIN_RPC_URLS del .env; `fetch` se mockea.
const CHAIN_ID = 137;
const CHAIN_ID_HEX = '0x89';
const CONTRACT_ADDRESS = '0x' + '1'.repeat(40);
const WALLET_ADDRESS = '0x' + 'a'.repeat(40);
const OTHER_ADDRESS = '0x' + 'b'.repeat(40);
const BLOCK_NUMBER = 1000;
const BLOCK_HASH = '0x' + 'ab'.repeat(32);
const BLOCK_TIMESTAMP = 1_700_000_000;

type JsonRpcPayload = { result?: unknown; error?: { code: number; message: string } };

function toHex(n: number): string {
  return '0x' + n.toString(16);
}

function padAddress(address: string): string {
  return '0x' + '0'.repeat(24) + address.slice(2).toLowerCase();
}

/**
 * Servidor JSON-RPC falso: enruta por `method` y devuelve el payload armado
 * por cada test. La forma de la respuesta replica la del fetch real.
 */
class MockRpcServer {
  private handlers = new Map<string, (params: unknown[]) => JsonRpcPayload>();

  fetch = jest.fn(
    async (
      _url: string,
      init: { body: string },
    ): Promise<{ ok: boolean; json: () => Promise<JsonRpcPayload> }> => {
      const { method, params } = JSON.parse(init.body) as {
        method: string;
        params: unknown[];
      };
      const handler = this.handlers.get(method);
      const payload = handler ? handler(params) : { result: null };
      return { ok: true, json: async () => payload };
    },
  );

  on(method: string, fn: (params: unknown[]) => JsonRpcPayload): void {
    this.handlers.set(method, fn);
  }

  reset(): void {
    this.handlers.clear();
    this.fetch.mockClear();
  }
}

describe('WEB3-003 — Verificación de propiedad NFT on-chain (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let fixtures: Fixtures;
  let server: MockRpcServer;
  const originalFetch = global.fetch;
  const server_ = () => app.getHttpServer();

  beforeAll(async () => {
    server = new MockRpcServer();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    fixtures = new Fixtures(app);

    global.fetch = server.fetch as unknown as typeof fetch;
  });

  afterAll(async () => {
    global.fetch = originalFetch;
    await app.close();
  });

  beforeEach(() => {
    server.reset();
  });

  afterEach(async () => {
    await cleanDatabase(dataSource);
  });

  /** Respuestas válidas por defecto; cada test ajusta lo que necesita. */
  function primeValidRpc(owner: string = WALLET_ADDRESS): void {
    server.on('eth_chainId', () => ({ result: CHAIN_ID_HEX }));
    server.on('eth_getCode', () => ({ result: '0x6080604052' }));
    server.on('eth_blockNumber', () => ({ result: toHex(BLOCK_NUMBER) }));
    server.on('eth_call', () => ({ result: padAddress(owner) }));
    server.on('eth_getBlockByNumber', () => ({
      result: {
        number: toHex(BLOCK_NUMBER),
        hash: BLOCK_HASH,
        timestamp: toHex(BLOCK_TIMESTAMP),
      },
    }));
  }

  async function setup(
    opts: {
      wallet?: string | null;
      nftOverrides?: Partial<NftProject>;
    } = {},
  ): Promise<{ user: User; nftProject: NftProject }> {
    const wallet = opts.wallet === undefined ? WALLET_ADDRESS : opts.wallet;
    const user = await fixtures.createUser(UserRole.MECENAS_SEMILLA, {
      cryptoWallet: wallet,
    });
    const nftProject = await fixtures.createNftProjectFixture({
      chainId: CHAIN_ID,
      contractAddress: CONTRACT_ADDRESS,
      tokenId: '42',
      ...(opts.nftOverrides ?? {}),
    });
    return { user, nftProject };
  }

  const verify = (nftProjectId: string, user: User) =>
    request(server_())
      .post(`/api/v1/nft-projects/${nftProjectId}/verify-ownership`)
      .set(fixtures.authHeader(user));

  // ─────────────────────────────────────────────────────────────
  // Positivo
  // ─────────────────────────────────────────────────────────────

  it('200 verified y persiste chainId/contrato/tokenId/bloque/timestamp cuando la wallet posee el NFT', async () => {
    primeValidRpc(WALLET_ADDRESS);
    const { user, nftProject } = await setup();

    const res = await verify(nftProject.id, user).expect(200);

    expect(res.body.owned).toBe(true);
    expect(res.body.status).toBe('verified');
    expect(res.body.chainId).toBe(CHAIN_ID);
    expect(res.body.contractAddress).toBe(CONTRACT_ADDRESS.toLowerCase());
    expect(res.body.tokenId).toBe('42');
    expect(res.body.walletAddress).toBe(WALLET_ADDRESS.toLowerCase());
    expect(res.body.ownerAddress).toBe(WALLET_ADDRESS.toLowerCase());
    expect(res.body.blockNumber).toBe(String(BLOCK_NUMBER));
    expect(res.body.blockHash).toBe(BLOCK_HASH);
    expect(res.body.blockTimestamp).toBeTruthy();
    expect(res.body.checkedAt).toBeTruthy();

    const repo = dataSource.getRepository(NftOwnershipVerification);
    const rows = await repo.find();
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('verified');
    expect(rows[0].blockNumber).toBe(String(BLOCK_NUMBER));
  });

  // ─────────────────────────────────────────────────────────────
  // Pruebas negativas del ticket
  // ─────────────────────────────────────────────────────────────

  it('prueba negativa 1: wallet sin el NFT → 200 not_owner (no error)', async () => {
    primeValidRpc(OTHER_ADDRESS);
    const { user, nftProject } = await setup({ wallet: WALLET_ADDRESS });

    const res = await verify(nftProject.id, user).expect(200);

    expect(res.body.owned).toBe(false);
    expect(res.body.status).toBe('not_owner');
    expect(res.body.ownerAddress).toBe(OTHER_ADDRESS.toLowerCase());
  });

  it('prueba negativa 2a: red distinta (RPC reporta otro chainId) → 200 invalid', async () => {
    primeValidRpc(WALLET_ADDRESS);
    server.on('eth_chainId', () => ({ result: '0x3e7' })); // 999
    const { user, nftProject } = await setup();

    const res = await verify(nftProject.id, user).expect(200);

    expect(res.body.owned).toBe(false);
    expect(res.body.status).toBe('invalid');
    expect(res.body.validationError).toMatch(/chainId/i);
  });

  it('prueba negativa 2b: contrato distinto (sin código) → 200 invalid', async () => {
    primeValidRpc(WALLET_ADDRESS);
    server.on('eth_getCode', () => ({ result: '0x' }));
    const { user, nftProject } = await setup();

    const res = await verify(nftProject.id, user).expect(200);

    expect(res.body.status).toBe('invalid');
    expect(res.body.validationError).toMatch(/contrato/i);
  });

  it('prueba negativa 3: transferir el NFT y re-verificar refleja el nuevo dueño', async () => {
    const { user, nftProject } = await setup({ wallet: WALLET_ADDRESS });

    primeValidRpc(WALLET_ADDRESS);
    const first = await verify(nftProject.id, user).expect(200);
    expect(first.body.status).toBe('verified');

    primeValidRpc(OTHER_ADDRESS);
    const second = await verify(nftProject.id, user).expect(200);
    expect(second.body.status).toBe('not_owner');
    expect(second.body.ownerAddress).toBe(OTHER_ADDRESS.toLowerCase());
  });

  // ─────────────────────────────────────────────────────────────
  // Errores RPC ≠ verificación correcta
  // ─────────────────────────────────────────────────────────────

  it('OBLIGATORIO: eth_call {-32000, "header not found"} → 503 (no invalid) y persiste unavailable', async () => {
    primeValidRpc(WALLET_ADDRESS);
    server.on('eth_call', () => ({
      error: { code: -32000, message: 'header not found' },
    }));
    const { user, nftProject } = await setup();

    await verify(nftProject.id, user).expect(503);

    const repo = dataSource.getRepository(NftOwnershipVerification);
    const rows = await repo.find();
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('unavailable');
    expect(rows[0].rpcError).toMatch(/header not found/i);
  });

  it('eth_call revert (código 3) → 200 invalid (respuesta válida, no 503)', async () => {
    primeValidRpc(WALLET_ADDRESS);
    server.on('eth_call', () => ({
      error: { code: 3, message: 'execution reverted' },
    }));
    const { user, nftProject } = await setup();

    const res = await verify(nftProject.id, user).expect(200);
    expect(res.body.status).toBe('invalid');
  });

  it('fallo de transporte en eth_chainId → 503', async () => {
    primeValidRpc(WALLET_ADDRESS);
    server.on('eth_chainId', () => ({
      error: { code: -32603, message: 'Internal error' },
    }));
    const { user, nftProject } = await setup();

    await verify(nftProject.id, user).expect(503);
  });

  // ─────────────────────────────────────────────────────────────
  // Configuración / autorización
  // ─────────────────────────────────────────────────────────────

  it('NFT inexistente → 404', async () => {
    primeValidRpc(WALLET_ADDRESS);
    const { user } = await setup();

    await verify('00000000-0000-4000-8000-000000000000', user).expect(404);
  });

  it('usuario sin wallet vinculada → 409 ANTES de tocar el RPC', async () => {
    primeValidRpc(WALLET_ADDRESS);
    const { user, nftProject } = await setup({ wallet: null });

    await verify(nftProject.id, user).expect(409);

    expect(server.fetch).not.toHaveBeenCalled();
  });

  it('NFT con red no configurada (chainId 0) → 409', async () => {
    primeValidRpc(WALLET_ADDRESS);
    const { user, nftProject } = await setup({
      nftOverrides: { chainId: 0 },
    });

    await verify(nftProject.id, user).expect(409);
  });

  it('sin sesión → 401', async () => {
    primeValidRpc(WALLET_ADDRESS);
    const { nftProject } = await setup();

    await request(server_())
      .post(`/api/v1/nft-projects/${nftProject.id}/verify-ownership`)
      .expect(401);
  });

  // ─────────────────────────────────────────────────────────────
  // Rate limit por usuario (no por IP)
  // ─────────────────────────────────────────────────────────────

  it('bloquea con 429 al superar 20 verificaciones/min del mismo usuario', async () => {
    primeValidRpc(WALLET_ADDRESS);
    const { user, nftProject } = await setup();

    let lastStatus = 0;
    for (let i = 0; i < 21; i++) {
      const res = await verify(nftProject.id, user);
      lastStatus = res.status;
    }

    expect(lastStatus).toBe(429);
  });

  it('otro usuario no comparte la cuota (el throttle es por usuario, no por IP)', async () => {
    primeValidRpc(WALLET_ADDRESS);
    const first = await setup({ wallet: WALLET_ADDRESS });
    const second = await setup({ wallet: '0x' + 'c'.repeat(40) });

    for (let i = 0; i < 21; i++) {
      await verify(first.nftProject.id, first.user);
    }

    // Misma IP del suite; si el throttle global por IP siguiera activo,
    // este request daría 429.
    const res = await verify(second.nftProject.id, second.user);
    expect(res.status).toBe(200);
  });
});
