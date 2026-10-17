// test/contract-validation.e2e-spec.ts

import request from 'supertest';
import { createTestApp, cleanDatabase, closeTestApp, E2eContext } from './e2e-setup';
import { Fixtures } from './fixtures';
import { UserRole, UserStatus } from 'src/users/entities/user.entity';
import { ProjectStatus, TrajectoryStatus } from 'src/projects/entities/project.entity';

describe('Contratos — Validación de enums y campos extra (e2e)', () => {
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

  describe('PATCH /api/v1/users/:id/role — UserRole enum + whitelist', () => {
    it('400 cuando un admin envía un rol fuera del enum', async () => {
      const admin = await fixtures.createUser(UserRole.ADMIN);
      const target = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .patch(`/api/v1/users/${target.id}/role`)
        .set(fixtures.authHeader(admin))
        .send({ role: 'superadmin', reason: 'Intento de escalada' })
        .expect(400);
    });

    it('400 cuando un admin envía rol válido con campo extra', async () => {
      const admin = await fixtures.createUser(UserRole.ADMIN);
      const target = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .patch(`/api/v1/users/${target.id}/role`)
        .set(fixtures.authHeader(admin))
        .send({ role: UserRole.EVALUATOR, reason: 'Designación formal', hackerField: 'x' })
        .expect(400);
    });
  });

  describe('PATCH /api/v1/users/:id/status — UserStatus enum + whitelist', () => {
    it('400 cuando un admin envía un estado fuera del enum', async () => {
      const admin = await fixtures.createUser(UserRole.ADMIN);
      const target = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .patch(`/api/v1/users/${target.id}/status`)
        .set(fixtures.authHeader(admin))
        .send({ status: 'invalid_status', reason: 'Test' })
        .expect(400);
    });

    it('400 cuando un admin envía estado válido con campo extra', async () => {
      const admin = await fixtures.createUser(UserRole.ADMIN);
      const target = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .patch(`/api/v1/users/${target.id}/status`)
        .set(fixtures.authHeader(admin))
        .send({ status: UserStatus.SUSPENDED, reason: 'Suspensión temporal', extraField: 'x' })
        .expect(400);
    });
  });

  describe('POST /api/v1/projects — ProjectStatus + TrajectoryStatus enums + whitelist', () => {
    it('400 cuando se envía status fuera del enum', async () => {
      const owner = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .post('/api/v1/projects')
        .set(fixtures.authHeader(owner))
        .send({ projectName: 'Proyecto test', status: 'unknown' })
        .expect(400);
    });

    it('400 cuando se envía trajectoryStatus fuera del enum', async () => {
      const owner = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .post('/api/v1/projects')
        .set(fixtures.authHeader(owner))
        .send({ projectName: 'Proyecto test', trajectoryStatus: 'unknown' })
        .expect(400);
    });

    it('400 cuando se envían enums válidos con campo extra', async () => {
      const owner = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .post('/api/v1/projects')
        .set(fixtures.authHeader(owner))
        .send({
          projectName: 'Proyecto test',
          status: ProjectStatus.ACTIVE,
          trajectoryStatus: TrajectoryStatus.ON_TRACK,
          injectedField: 'x',
        })
        .expect(400);
    });
  });

  describe('PATCH /api/v1/projects/:id — UpdateProjectDto (PartialType) + whitelist', () => {
    it('400 cuando owner envía status fuera del enum', async () => {
      const owner = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const project = await fixtures.createProject(owner.id);

      await request(server())
        .patch(`/api/v1/projects/${project.id}`)
        .set(fixtures.authHeader(owner))
        .send({ status: 'unknown' })
        .expect(400);
    });

    it('400 cuando owner envía trajectoryStatus fuera del enum', async () => {
      const owner = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const project = await fixtures.createProject(owner.id);

      await request(server())
        .patch(`/api/v1/projects/${project.id}`)
        .set(fixtures.authHeader(owner))
        .send({ trajectoryStatus: 'unknown' })
        .expect(400);
    });

    it('400 cuando owner envía enums válidos con campo extra', async () => {
      const owner = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const project = await fixtures.createProject(owner.id);

      await request(server())
        .patch(`/api/v1/projects/${project.id}`)
        .set(fixtures.authHeader(owner))
        .send({
          status: ProjectStatus.ACTIVE,
          trajectoryStatus: TrajectoryStatus.ON_TRACK,
          injectedField: 'x',
        })
        .expect(400);
    });
  });
});
