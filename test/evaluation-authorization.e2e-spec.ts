// test/evaluation-authorization.e2e-spec.ts

import request from 'supertest';
import { createTestApp, cleanDatabase, closeTestApp, E2eContext } from './e2e-setup';
import { Fixtures } from './fixtures';
import { UserRole } from 'src/users/entities/user.entity';
import { EvidenceStatus } from 'src/evidence/entities/evidence.entity';

describe('Evaluation & Rubrics — matriz de autorización (QA-SEC-002/003/004, QA-TEST-002) (e2e)', () => {
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

  describe('POST /api/v1/evaluations/rubrics — solo ADMIN', () => {
    const payload = {
      code: 'RUB-E2E-001',
      name_es: 'Rúbrica e2e',
      name_en: 'E2E rubric',
      targetEntity: 'evidence',
      version: 'v1.0',
      criteriaJson: { dimensions: [{ name: 'consistency', weight: 1 }] },
    };

    it.each([[UserRole.ENTREPRENEUR], [UserRole.MENTOR], [UserRole.EVALUATOR]])(
      '403 cuando el actor tiene rol %s',
      async (role) => {
        const actor = await fixtures.createUser(role);
        await request(server())
          .post('/api/v1/evaluations/rubrics')
          .set(fixtures.authHeader(actor))
          .send(payload)
          .expect(403);
      },
    );

    it('201 cuando el actor es ADMIN', async () => {
      const admin = await fixtures.createUser(UserRole.ADMIN);
      const res = await request(server())
        .post('/api/v1/evaluations/rubrics')
        .set(fixtures.authHeader(admin))
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.code).toBe(payload.code);
    });

    it('rúbrica usada en una evaluación pasa a ser inmutable', async () => {
      const admin = await fixtures.createUser(UserRole.ADMIN);
      const evaluator = await fixtures.createUser(UserRole.EVALUATOR);

      const { instanceA, ownerA, projectA } = await fixtures.createTwoTenantScenario();
      await fixtures.addProjectMember(projectA.id, evaluator.id);

      const rubric = await fixtures.createRubric();
      const evidence = await fixtures.createEvidence({
        microActionInstanceId: instanceA.id,
        authorUserId: ownerA.id,
        projectId: instanceA.projectId,
        status: EvidenceStatus.SUBMITTED,
      });

      await request(server())
        .post('/api/v1/evaluations')
        .set(fixtures.authHeader(evaluator))
        .send({ evidenceId: evidence.id, rubricId: rubric.id })
        .expect(201);

      const res = await request(server())
        .patch(`/api/v1/evaluations/rubrics/${rubric.id}`)
        .set(fixtures.authHeader(admin))
        .send({ name_es: 'Nombre editado' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/evaluations — solo ADMIN/EVALUATOR y con acceso al tenant', () => {
    it.each([[UserRole.ENTREPRENEUR], [UserRole.MENTOR]])(
      '403 (RolesGuard) cuando el actor tiene rol %s, aunque sea miembro del proyecto',
      async (role) => {
        const { instanceA, ownerA, projectA } = await fixtures.createTwoTenantScenario();
        const actor = await fixtures.createUser(role);
        await fixtures.addProjectMember(projectA.id, actor.id);

        const rubric = await fixtures.createRubric();
        const evidence = await fixtures.createEvidence({
          microActionInstanceId: instanceA.id,
          authorUserId: ownerA.id,
          projectId: instanceA.projectId,
          status: EvidenceStatus.SUBMITTED,
        });

        await request(server())
          .post('/api/v1/evaluations')
          .set(fixtures.authHeader(actor))
          .send({ evidenceId: evidence.id, rubricId: rubric.id })
          .expect(403);
      },
    );

    it('403 (ProjectAccessService) cuando un EVALUATOR de otro tenant intenta evaluar', async () => {
      const { instanceA, ownerA, projectB } = await fixtures.createTwoTenantScenario();
      const evaluatorOfB = await fixtures.createUser(UserRole.EVALUATOR);
      await fixtures.addProjectMember(projectB.id, evaluatorOfB.id);

      const rubric = await fixtures.createRubric();
      const evidence = await fixtures.createEvidence({
        microActionInstanceId: instanceA.id,
        authorUserId: ownerA.id,
        projectId: instanceA.projectId,
        status: EvidenceStatus.SUBMITTED,
      });

      await request(server())
        .post('/api/v1/evaluations')
        .set(fixtures.authHeader(evaluatorOfB))
        .send({ evidenceId: evidence.id, rubricId: rubric.id })
        .expect(403);
    });

    it('201 cuando un EVALUATOR miembro del tenant correcto evalúa una evidencia SUBMITTED', async () => {
      const { instanceA, ownerA, projectA } = await fixtures.createTwoTenantScenario();
      const evaluator = await fixtures.createUser(UserRole.EVALUATOR);
      await fixtures.addProjectMember(projectA.id, evaluator.id);

      const rubric = await fixtures.createRubric();
      const evidence = await fixtures.createEvidence({
        microActionInstanceId: instanceA.id,
        authorUserId: ownerA.id,
        projectId: instanceA.projectId,
        status: EvidenceStatus.SUBMITTED,
      });

      const res = await request(server())
        .post('/api/v1/evaluations')
        .set(fixtures.authHeader(evaluator))
        .send({ evidenceId: evidence.id, rubricId: rubric.id });

      expect(res.status).toBe(201);
    });

    it('400 al intentar crear una segunda evaluación activa para la misma evidencia', async () => {
      const { instanceA, ownerA, projectA } = await fixtures.createTwoTenantScenario();
      const evaluator = await fixtures.createUser(UserRole.EVALUATOR);
      await fixtures.addProjectMember(projectA.id, evaluator.id);

      const rubric = await fixtures.createRubric();
      const evidence = await fixtures.createEvidence({
        microActionInstanceId: instanceA.id,
        authorUserId: ownerA.id,
        projectId: instanceA.projectId,
        status: EvidenceStatus.SUBMITTED,
      });

      await request(server())
        .post('/api/v1/evaluations')
        .set(fixtures.authHeader(evaluator))
        .send({ evidenceId: evidence.id, rubricId: rubric.id })
        .expect(201);

      await request(server())
        .post('/api/v1/evaluations')
        .set(fixtures.authHeader(evaluator))
        .send({ evidenceId: evidence.id, rubricId: rubric.id })
        .expect(400);
    });
  });

  describe('POST /api/v1/evaluations/finalize — solo ADMIN/EVALUATOR', () => {
    it('403 cuando un ENTREPRENEUR intenta finalizar', async () => {
      const { instanceA, ownerA, projectA } = await fixtures.createTwoTenantScenario();
      const evaluator = await fixtures.createUser(UserRole.EVALUATOR);
      await fixtures.addProjectMember(projectA.id, evaluator.id);

      const rubric = await fixtures.createRubric();
      const evidence = await fixtures.createEvidence({
        microActionInstanceId: instanceA.id,
        authorUserId: ownerA.id,
        projectId: instanceA.projectId,
        status: EvidenceStatus.SUBMITTED,
      });

      const createRes = await request(server())
        .post('/api/v1/evaluations')
        .set(fixtures.authHeader(evaluator))
        .send({ evidenceId: evidence.id, rubricId: rubric.id });

      await request(server())
        .post('/api/v1/evaluations/finalize')
        .set(fixtures.authHeader(ownerA))
        .send({ evaluationId: createRes.body.id, evaluationResult: 'approved' })
        .expect(403);
    });

    it('no permite finalizar la misma evaluación dos veces', async () => {
      const { instanceA, ownerA, projectA } = await fixtures.createTwoTenantScenario();
      const evaluator = await fixtures.createUser(UserRole.EVALUATOR);
      await fixtures.addProjectMember(projectA.id, evaluator.id);

      const rubric = await fixtures.createRubric();
      const evidence = await fixtures.createEvidence({
        microActionInstanceId: instanceA.id,
        authorUserId: ownerA.id,
        projectId: instanceA.projectId,
        status: EvidenceStatus.SUBMITTED,
      });

      const createRes = await request(server())
        .post('/api/v1/evaluations')
        .set(fixtures.authHeader(evaluator))
        .send({ evidenceId: evidence.id, rubricId: rubric.id });

      await request(server())
        .post('/api/v1/evaluations/finalize')
        .set(fixtures.authHeader(evaluator))
        .send({ evaluationId: createRes.body.id, evaluationResult: 'approved' })
        .expect(200);

      await request(server())
        .post('/api/v1/evaluations/finalize')
        .set(fixtures.authHeader(evaluator))
        .send({ evaluationId: createRes.body.id, evaluationResult: 'approved' })
        .expect(400);
    });
  });
});
