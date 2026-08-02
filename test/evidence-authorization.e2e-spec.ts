// test/evidence-authorization.e2e-spec.ts

import request from 'supertest';
import { createTestApp, cleanDatabase, closeTestApp, E2eContext } from './e2e-setup';
import { Fixtures } from './fixtures';
import { UserRole } from 'src/users/entities/user.entity';
import { EvidenceStatus } from 'src/evidence/entities/evidence.entity';

describe.skip('Evidence — QA-SEC-005 (IDOR) y aislamiento multi-tenant (e2e)', () => {
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

  describe('GET /api/v1/evidence/:id', () => {
    it('403 cuando un usuario ajeno al proyecto intenta leer la evidencia', async () => {
      const { instanceA, ownerA, projectB } = await fixtures.createTwoTenantScenario();
      const outsider = await fixtures.createUser(UserRole.ENTREPRENEUR);

      const evidence = await fixtures.createEvidence({
        microActionInstanceId: instanceA.id,
        authorUserId: ownerA.id,
        projectId: instanceA.projectId,
      });

      const res = await request(server())
        .get(`/api/v1/evidence/${evidence.id}`)
        .set(fixtures.authHeader(outsider));

      expect(res.status).toBe(403);
      void projectB; // no se usa acá, queda documentado el escenario de 2 tenants
    });

    it('403 cuando un miembro del proyecto B intenta leer una evidencia del proyecto A', async () => {
      const { instanceA, ownerA, projectB } = await fixtures.createTwoTenantScenario();
      const memberOfB = await fixtures.createUser(UserRole.MENTOR);
      await fixtures.addProjectMember(projectB.id, memberOfB.id);

      const evidence = await fixtures.createEvidence({
        microActionInstanceId: instanceA.id,
        authorUserId: ownerA.id,
        projectId: instanceA.projectId,
      });

      await request(server())
        .get(`/api/v1/evidence/${evidence.id}`)
        .set(fixtures.authHeader(memberOfB))
        .expect(403);
    });

    it('200 cuando el dueño del proyecto lee su propia evidencia', async () => {
      const { instanceA, ownerA } = await fixtures.createTwoTenantScenario();
      const evidence = await fixtures.createEvidence({
        microActionInstanceId: instanceA.id,
        authorUserId: ownerA.id,
        projectId: instanceA.projectId,
      });

      const res = await request(server())
        .get(`/api/v1/evidence/${evidence.id}`)
        .set(fixtures.authHeader(ownerA));

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(evidence.id);
    });

    it('200 cuando un miembro activo del mismo proyecto lee la evidencia', async () => {
      const { instanceA, ownerA, projectA } = await fixtures.createTwoTenantScenario();
      const teammate = await fixtures.createUser(UserRole.MENTOR);
      await fixtures.addProjectMember(projectA.id, teammate.id);

      const evidence = await fixtures.createEvidence({
        microActionInstanceId: instanceA.id,
        authorUserId: ownerA.id,
        projectId: instanceA.projectId,
      });

      await request(server())
        .get(`/api/v1/evidence/${evidence.id}`)
        .set(fixtures.authHeader(teammate))
        .expect(200);
    });

    it('200 cuando ADMIN lee cualquier evidencia sin ser miembro', async () => {
      const { instanceA, ownerA } = await fixtures.createTwoTenantScenario();
      const admin = await fixtures.createUser(UserRole.ADMIN);

      const evidence = await fixtures.createEvidence({
        microActionInstanceId: instanceA.id,
        authorUserId: ownerA.id,
        projectId: instanceA.projectId,
      });

      await request(server())
        .get(`/api/v1/evidence/${evidence.id}`)
        .set(fixtures.authHeader(admin))
        .expect(200);
    });

    it('404 para un ID de evidencia inexistente (no filtra existencia vía 403 vs 404 de forma inconsistente)', async () => {
      const { ownerA } = await fixtures.createTwoTenantScenario();
      await request(server())
        .get('/api/v1/evidence/00000000-0000-0000-0000-000000000000')
        .set(fixtures.authHeader(ownerA))
        .expect(404);
    });
  });

  describe('GET /api/v1/evidence/project/:projectId — listado por proyecto', () => {
    it('403 cuando se intenta listar evidencias de un proyecto ajeno', async () => {
      const { projectA } = await fixtures.createTwoTenantScenario();
      const outsider = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .get(`/api/v1/evidence/project/${projectA.id}`)
        .set(fixtures.authHeader(outsider))
        .expect(403);
    });

    it('200 y no incluye evidencias de otro proyecto', async () => {
      const { instanceA, ownerA, projectA, instanceB, ownerB } =
        await fixtures.createTwoTenantScenario();

      const evidenceA = await fixtures.createEvidence({
        microActionInstanceId: instanceA.id,
        authorUserId: ownerA.id,
        projectId: instanceA.projectId,
      });
      await fixtures.createEvidence({
        microActionInstanceId: instanceB.id,
        authorUserId: ownerB.id,
        projectId: instanceB.projectId,
      });

      const res = await request(server())
        .get(`/api/v1/evidence/project/${projectA.id}`)
        .set(fixtures.authHeader(ownerA));

      expect(res.status).toBe(200);
      const ids = res.body.map((e: { id: string }) => e.id);
      expect(ids).toContain(evidenceA.id);
      expect(ids).toHaveLength(1);
      void projectA;
    });
  });

  describe('GET /api/v1/evidence/:id/versions', () => {
    it('403 cuando un usuario ajeno pide el historial de versiones', async () => {
      const { instanceA, ownerA } = await fixtures.createTwoTenantScenario();
      const outsider = await fixtures.createUser(UserRole.ENTREPRENEUR);

      const evidence = await fixtures.createEvidence({
        microActionInstanceId: instanceA.id,
        authorUserId: ownerA.id,
        projectId: instanceA.projectId,
      });

      await request(server())
        .get(`/api/v1/evidence/${evidence.id}/versions`)
        .set(fixtures.authHeader(outsider))
        .expect(403);
    });
  });

  describe('DELETE /api/v1/evidence/:id — solo el autor, y solo en DRAFT', () => {
    it('403 cuando otro usuario intenta borrar una evidencia ajena', async () => {
      const { instanceA, ownerA } = await fixtures.createTwoTenantScenario();
      const outsider = await fixtures.createUser(UserRole.ENTREPRENEUR);

      const evidence = await fixtures.createEvidence({
        microActionInstanceId: instanceA.id,
        authorUserId: ownerA.id,
        projectId: instanceA.projectId,
        status: EvidenceStatus.DRAFT,
      });

      await request(server())
        .delete(`/api/v1/evidence/${evidence.id}`)
        .set(fixtures.authHeader(outsider))
        .expect(403);
    });

    it('400 cuando el autor intenta borrar una evidencia que ya no está en DRAFT', async () => {
      const { instanceA, ownerA } = await fixtures.createTwoTenantScenario();

      const evidence = await fixtures.createEvidence({
        microActionInstanceId: instanceA.id,
        authorUserId: ownerA.id,
        projectId: instanceA.projectId,
        status: EvidenceStatus.SUBMITTED,
      });

      await request(server())
        .delete(`/api/v1/evidence/${evidence.id}`)
        .set(fixtures.authHeader(ownerA))
        .expect(400);
    });
  });
});
