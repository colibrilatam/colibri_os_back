// test/user-authorization.e2e-spec.ts

import request from 'supertest';
import { createTestApp, cleanDatabase, closeTestApp, E2eContext } from './e2e-setup';
import { Fixtures } from './fixtures';
import { UserRole } from 'src/users/entities/user.entity';

describe('Users — SEC-006 (IDOR / autorización por recurso) (e2e)', () => {
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

  describe('PATCH /api/v1/users/:id — usuario B actualiza al usuario A', () => {
    it('403 cuando un usuario ajeno intenta actualizar el perfil de otro', async () => {
      const userA = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const userB = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .patch(`/api/v1/users/${userA.id}`)
        .set(fixtures.authHeader(userB))
        .send({ fullName: 'Hackeado por B' })
        .expect(403);
    });

    it('200 cuando el usuario actualiza su propio perfil', async () => {
      const userA = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .patch(`/api/v1/users/${userA.id}`)
        .set(fixtures.authHeader(userA))
        .send({ fullName: 'Nombre actualizado por su dueño' })
        .expect(200);
    });

    it('200 cuando un ADMIN actualiza el perfil de otro usuario', async () => {
      const admin = await fixtures.createUser(UserRole.ADMIN);
      const userA = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .patch(`/api/v1/users/${userA.id}`)
        .set(fixtures.authHeader(admin))
        .send({ fullName: 'Actualizado por admin' })
        .expect(200);
    });
  });

  describe('DELETE /api/v1/users/:id — usuario B desactiva al usuario A', () => {
    it('403 cuando un usuario ajeno intenta desactivar a otro', async () => {
      const userA = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const userB = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .delete(`/api/v1/users/${userA.id}`)
        .set(fixtures.authHeader(userB))
        .expect(403);
    });

    it('200 cuando un ADMIN desactiva a otro usuario', async () => {
      const admin = await fixtures.createUser(UserRole.ADMIN);
      const userA = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .delete(`/api/v1/users/${userA.id}`)
        .set(fixtures.authHeader(admin))
        .expect(200);
    });
  });

  describe('GET /api/v1/users — usuario sin permisos lista usuarios de otra organización', () => {
    it('403 cuando un usuario no-admin intenta listar todos los usuarios', async () => {
      const userB = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .get('/api/v1/users')
        .set(fixtures.authHeader(userB))
        .expect(403);
    });

    it('200 y no expone password cuando un ADMIN lista usuarios', async () => {
      const admin = await fixtures.createUser(UserRole.ADMIN);
      await fixtures.createUser(UserRole.ENTREPRENEUR);

      const res = await request(server())
        .get('/api/v1/users')
        .set(fixtures.authHeader(admin))
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      for (const user of res.body) {
        expect(user.password).toBeUndefined();
      }
    });
  });

  describe('GET /api/v1/users/:id — acceso al perfil ajeno', () => {
    it('403 cuando un usuario intenta ver el perfil de otro sin ser admin', async () => {
      const userA = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const userB = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .get(`/api/v1/users/${userA.id}`)
        .set(fixtures.authHeader(userB))
        .expect(403);
    });

    it('200 cuando el usuario consulta su propio perfil', async () => {
      const userA = await fixtures.createUser(UserRole.ENTREPRENEUR);

      const res = await request(server())
        .get(`/api/v1/users/${userA.id}`)
        .set(fixtures.authHeader(userA))
        .expect(200);

      expect(res.body.password).toBeUndefined();
    });
  });

  describe('PATCH /api/v1/users/:id/role — solo un ADMIN puede cambiar roles', () => {
    it('403 cuando un usuario no-admin intenta cambiar el rol de otro', async () => {
      const userA = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const userB = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .patch(`/api/v1/users/${userA.id}/role`)
        .set(fixtures.authHeader(userB))
        .send({ role: UserRole.ADMIN, reason: 'Autoescalada' })
        .expect(403);
    });

    it('403 cuando un usuario intenta autoescalar su propio rol', async () => {
      const userB = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .patch(`/api/v1/users/${userB.id}/role`)
        .set(fixtures.authHeader(userB))
        .send({ role: UserRole.ADMIN, reason: 'Autoescalada' })
        .expect(403);
    });

    it('200 cuando un ADMIN cambia el rol de otro usuario', async () => {
      const admin = await fixtures.createUser(UserRole.ADMIN);
      const target = await fixtures.createUser(UserRole.ENTREPRENEUR);

      const res = await request(server())
        .patch(`/api/v1/users/${target.id}/role`)
        .set(fixtures.authHeader(admin))
        .send({ role: UserRole.EVALUATOR, reason: 'Designación formal.' })
        .expect(200);

      expect(res.body.role).toBe(UserRole.EVALUATOR);
    });
  });
});