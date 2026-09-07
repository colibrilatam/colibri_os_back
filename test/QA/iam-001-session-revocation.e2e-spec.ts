import request from 'supertest';
import { createTestApp, cleanDatabase, closeTestApp, E2eContext } from '../e2e-setup';
import { Fixtures } from '../fixtures';
import { UserRole, UserStatus } from 'src/users/entities/user.entity';

describe('IAM-001 — Revocación de sesión (e2e)', () => {
  let ctx: E2eContext;
  let fixtures: Fixtures;
  const server = () => ctx.app.getHttpServer();

  beforeAll(async () => {
    ctx = await createTestApp();
    fixtures = new Fixtures(ctx.app);
  });

  afterEach(async () => {
    await cleanDatabase(ctx.dataSource);
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  describe('POST /api/v1/auth/signin', () => {
    it('un usuario con estado "inactive" no puede iniciar sesión', async () => {
      const user = await fixtures.createUser(UserRole.ENTREPRENEUR, {
        status: UserStatus.INACTIVE,
      });

      await request(server())
        .post('/api/v1/auth/signin')
        .send({ email: user.email, password: 'Test@1234' })
        .expect(401);
    });

    it('un usuario con estado "suspended" no puede iniciar sesión', async () => {
      const user = await fixtures.createUser(UserRole.ENTREPRENEUR, {
        status: UserStatus.SUSPENDED,
      });

      await request(server())
        .post('/api/v1/auth/signin')
        .send({ email: user.email, password: 'Test@1234' })
        .expect(401);
    });

    it('un usuario activo recibe token + refreshToken', async () => {
      const user = await fixtures.createUser(UserRole.ENTREPRENEUR);

      const res = await request(server())
        .post('/api/v1/auth/signin')
        .send({ email: user.email, password: 'Test@1234' })
        .expect(201);

      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });
  });

  describe('Un JWT existente deja de funcionar tras la suspensión', () => {
    it('token válido antes de suspender, inválido después', async () => {
      const user = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const token = fixtures.tokenFor(user);

      await request(server())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      await fixtures.setUserStatus(user.id, UserStatus.SUSPENDED);

      await request(server())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('el endpoint admin de suspensión revoca la sesión de inmediato', async () => {
      const admin = await fixtures.createUser(UserRole.ADMIN);
      const target = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const targetToken = fixtures.tokenFor(target);

      await request(server())
        .patch(`/api/v1/users/${target.id}/status`)
        .set(fixtures.authHeader(admin))
        .send({ status: UserStatus.SUSPENDED, reason: 'Reporte de la comunidad.' })
        .expect(200);

      await request(server())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${targetToken}`)
        .expect(401);
    });

    it('un usuario que no es ADMIN no puede suspender a otro', async () => {
      const entrepreneur = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const target = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .patch(`/api/v1/users/${target.id}/status`)
        .set(fixtures.authHeader(entrepreneur))
        .send({ status: UserStatus.SUSPENDED, reason: 'Intento no autorizado.' })
        .expect(403);
    });
  });

  describe('El cambio de contraseña invalida sesiones anteriores', () => {
    it('access token y refresh token previos quedan revocados', async () => {
      const user = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const oldToken = fixtures.tokenFor(user);
      const oldRefreshToken = await fixtures.issueRefreshToken(user);

      await request(server())
        .patch('/api/v1/users/me/password')
        .set(fixtures.authHeader(user))
        .send({
          currentPassword: 'Test@1234',
          newPassword: 'NuevaPass@456',
          confirmNewPassword: 'NuevaPass@456',
        })
        .expect(200);

      await request(server())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${oldToken}`)
        .expect(401);

      await request(server())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(401);

      await request(server())
        .post('/api/v1/auth/signin')
        .send({ email: user.email, password: 'Test@1234' })
        .expect(401);

      await request(server())
        .post('/api/v1/auth/signin')
        .send({ email: user.email, password: 'NuevaPass@456' })
        .expect(201);
    });

    it('rechaza el cambio si la contraseña actual es incorrecta', async () => {
      const user = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .patch('/api/v1/users/me/password')
        .set(fixtures.authHeader(user))
        .send({
          currentPassword: 'Incorrecta@000',
          newPassword: 'NuevaPass@456',
          confirmNewPassword: 'NuevaPass@456',
        })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('emite un nuevo par de tokens y rota el refresh token', async () => {
      const user = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const refreshToken = await fixtures.issueRefreshToken(user);

      const res = await request(server())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(201);

      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.refreshToken).not.toBe(refreshToken);
    });

    it('rechaza la reutilización de un refresh token ya rotado', async () => {
      const user = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const refreshToken = await fixtures.issueRefreshToken(user);

      await request(server()).post('/api/v1/auth/refresh').send({ refreshToken }).expect(201);
      await request(server()).post('/api/v1/auth/refresh').send({ refreshToken }).expect(401);
    });

    it('rechaza el refresh de una sesión suspendida', async () => {
      const user = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const refreshToken = await fixtures.issueRefreshToken(user);

      await fixtures.setUserStatus(user.id, UserStatus.SUSPENDED);

      await request(server()).post('/api/v1/auth/refresh').send({ refreshToken }).expect(401);
    });

    it('rechaza un refresh token inventado', async () => {
      await request(server())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'token-que-no-existe' })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('revoca el refresh token indicado', async () => {
      const user = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const refreshToken = await fixtures.issueRefreshToken(user);

      await request(server()).post('/api/v1/auth/logout').send({ refreshToken }).expect(201);
      await request(server()).post('/api/v1/auth/refresh').send({ refreshToken }).expect(401);
    });
  });
});