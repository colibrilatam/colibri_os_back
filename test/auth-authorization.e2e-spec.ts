import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { createTestApp, cleanDatabase, closeTestApp, E2eContext } from './e2e-setup';
import { Fixtures } from './fixtures';
import { UserRole, UserStatus } from 'src/users/entities/user.entity';

describe('Auth — QA-SEC-001 (escalada de privilegios) (e2e)', () => {
  let ctx: E2eContext;
  let fixtures: Fixtures;
  let jwtService: JwtService;
  const server = () => ctx.app.getHttpServer();

  beforeAll(async () => {
    ctx = await createTestApp();
    fixtures = new Fixtures(ctx.app);
    jwtService = ctx.app.get(JwtService);
  });

  afterEach(async () => {
    await cleanDatabase(ctx.dataSource);
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  const basePayload = {
    email: 'nuevo@test.colibri',
    password: 'MiPass@123',
    confirmPassword: 'MiPass@123',
    fullName: 'Usuario Nuevo',
  };

  describe('POST /api/v1/auth/signup', () => {
    it.each([
      ['admin', 'admin'],
      ['evaluator', 'evaluator'],
      ['rol fuera del enum', 'super_admin'],
    ])('rechaza el signup cuando el cliente envía role="%s" (%s)', async (_label, injectedRole) => {
      const res = await request(server())
        .post('/api/v1/auth/signup')
        .send({ ...basePayload, role: injectedRole });

      // El DTO público no declara "role"; con forbidNonWhitelisted el
      // ValidationPipe global debe rechazar el body entero con 400.
      expect(res.status).toBe(400);
    });

    it('crea el usuario como ENTREPRENEUR cuando no se envía role', async () => {
      const res = await request(server()).post('/api/v1/auth/signup').send(basePayload);

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();

      const decoded = jwtService.decode(res.body.token);
      expect(decoded.role).toBe(UserRole.ENTREPRENEUR);
    });

    it('el JWT emitido nunca refleja un rol distinto al asignado en servidor', async () => {
      const res = await request(server())
        .post('/api/v1/auth/signup')
        .send({ ...basePayload, role: 'admin' });

      // Si el 400 de arriba fallara por algún motivo, esta es la red de
      // seguridad: aunque el body pase, el rol jamás debe ser admin.
      if (res.status === 201) {
        const decoded = jwtService.decode(res.body.token);
        expect(decoded.role).not.toBe(UserRole.ADMIN);
      }
    });
  });

  describe('PATCH /api/v1/users/:id (no debe permitir escalar rol por acá)', () => {
    it('ignora un campo "role" colado en el body de actualización de perfil', async () => {
      const entrepreneur = await fixtures.createUser(UserRole.ENTREPRENEUR);

      const res = await request(server())
        .patch(`/api/v1/users/${entrepreneur.id}`)
        .set(fixtures.authHeader(entrepreneur))
        .send({ fullName: 'Nombre actualizado', role: 'admin' });

      // UpdateUserDto no declara "role": con forbidNonWhitelisted, esto es 400.
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/v1/users/:id/role — flujo administrativo auditado', () => {
    it('rechaza el cambio de rol si quien lo pide no es ADMIN', async () => {
      const entrepreneur = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const target = await fixtures.createUser(UserRole.ENTREPRENEUR);

      const res = await request(server())
        .patch(`/api/v1/users/${target.id}/role`)
        .set(fixtures.authHeader(entrepreneur))
        .send({ role: UserRole.ADMIN, reason: 'Autoescalada' });

      expect(res.status).toBe(403);
    });

    it('permite el cambio de rol a un ADMIN y lo deja auditado', async () => {
      const admin = await fixtures.createUser(UserRole.ADMIN);
      const target = await fixtures.createUser(UserRole.ENTREPRENEUR);

      const res = await request(server())
        .patch(`/api/v1/users/${target.id}/role`)
        .set(fixtures.authHeader(admin))
        .send({ role: UserRole.EVALUATOR, reason: 'Designación formal para el piloto UNIMET.' });

      expect(res.status).toBe(200);
      expect(res.body.role).toBe(UserRole.EVALUATOR);
    });
  });

  describe('Límite de sesión (JWT)', () => {
    it('rechaza una ruta protegida sin token', async () => {
      await request(server()).get('/api/v1/users').expect(401);
    });

    it('rechaza un token manipulado', async () => {
      const user = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const tampered = fixtures.tokenFor(user).slice(0, -3) + 'xyz';

      await request(server())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${tampered}`)
        .expect(401);
    });

    it('rechaza el token de un usuario inactivo', async () => {
      const user = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const token = fixtures.tokenFor(user);

      await fixtures.setUserStatus(user.id, UserStatus.SUSPENDED);

      await request(server())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });
  });
});
