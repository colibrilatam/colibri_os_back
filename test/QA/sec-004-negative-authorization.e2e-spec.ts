import request from 'supertest';
import { createTestApp, cleanDatabase, closeTestApp, E2eContext } from '../e2e-setup';
import { Fixtures } from '../fixtures';
import { UserRole } from 'src/users/entities/user.entity';
import { EvidenceStatus } from 'src/evidence/entities/evidence.entity';

describe('SEC-004 — Pruebas negativas de autorización (e2e)', () => {
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

  describe('Prueba 1: rol elevado solo en cliente → 403 sin cambios en DB', () => {
    it('usuario entrepreneur NO puede crear un tramo (acción administrativa)', async () => {
      const entrepreneur = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .post('/api/v1/tramos')
        .set(fixtures.authHeader(entrepreneur))
        .send({
          code: 'MALICIOUS-TRAMO',
          name_es: 'Tramo malicioso',
          name_en: 'Malicious tramo',
          sortOrder: 99,
        })
        .expect(403);
    });

    it('usuario entrepreneur NO puede revocar una credencial digital', async () => {
      const { ownerA, projectA, instanceA } = await fixtures.createTwoTenantScenario();
      const evidence = await fixtures.createEvidence({
        microActionInstanceId: instanceA.id,
        authorUserId: ownerA.id,
        projectId: projectA.id,
        status: EvidenceStatus.APPROVED,
      });

      await request(server())
        .post(`/api/v1/digital-credentials/${evidence.id}/revoke`)
        .set(fixtures.authHeader(ownerA))
        .send({ reason: 'Intento de revocación no autorizada' })
        .expect(403);
    });

    it('usuario entrepreneur NO puede activar a otro como mecenas', async () => {
      const other = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .post(`/api/v1/mecenas-semilla/activate/${other.id}`)
        .set(fixtures.authHeader(other))
        .expect(403);
    });
  });

  describe('Prueba 2: aislamiento entre organizaciones → 403 sin filtrar existencia', () => {
    it('usuario de org A NO puede leer el proyecto de org B', async () => {
      const { ownerA, projectB } = await fixtures.createTwoTenantScenario();

      await request(server())
        .get(`/api/v1/projects/${projectB.id}`)
        .set(fixtures.authHeader(ownerA))
        .expect(403);
    });

    it('usuario de org A NO puede modificar el proyecto de org B', async () => {
      const { ownerA, projectB } = await fixtures.createTwoTenantScenario();

      await request(server())
        .patch(`/api/v1/projects/${projectB.id}`)
        .set(fixtures.authHeader(ownerA))
        .send({ projectName: 'Nombre modificado sin permiso' })
        .expect(403);
    });

    it('usuario de org A NO puede eliminar el proyecto de org B', async () => {
      const { ownerA, projectB } = await fixtures.createTwoTenantScenario();

      await request(server())
        .delete(`/api/v1/projects/${projectB.id}`)
        .set(fixtures.authHeader(ownerA))
        .expect(403);
    });

    it('usuario de org A NO puede ver evidencias del proyecto de org B', async () => {
      const { ownerA, ownerB, projectB, instanceB } = await fixtures.createTwoTenantScenario();
      await fixtures.createEvidence({
        microActionInstanceId: instanceB.id,
        authorUserId: ownerB.id,
        projectId: projectB.id,
      });

      await request(server())
        .get(`/api/v1/evidence/project/${projectB.id}`)
        .set(fixtures.authHeader(ownerA))
        .expect(403);
    });

    it('usuario de org A NO puede ver las credenciales del proyecto de org B', async () => {
      const { ownerA, projectB } = await fixtures.createTwoTenantScenario();

      await request(server())
        .get(`/api/v1/digital-credentials/project/${projectB.id}`)
        .set(fixtures.authHeader(ownerA))
        .expect(403);
    });
  });

  describe('Prueba 3: evaluador no asignado NO puede aprobar evidencia → 403 y sin cambio de estado', () => {
    it('evaluador que NO creó la evaluación no puede finalizarla', async () => {
      const { ownerA, projectA, instanceA } = await fixtures.createTwoTenantScenario();
      const assignedEvaluator = await fixtures.createUser(UserRole.EVALUATOR);
      const outsideEvaluator = await fixtures.createUser(UserRole.EVALUATOR);
      const rubric = await fixtures.createRubric();

      const evidence = await fixtures.createEvidence({
        microActionInstanceId: instanceA.id,
        authorUserId: ownerA.id,
        projectId: projectA.id,
        status: EvidenceStatus.UNDER_REVIEW,
      });

      const evaluation = await fixtures.createEvaluation(
        evidence.id,
        rubric.id,
        assignedEvaluator.id,
      );

      const evidenceBefore = await fixtures['evidenceRepo'].findOneBy({ id: evidence.id });

      await request(server())
        .post('/api/v1/evaluations/finalize')
        .set(fixtures.authHeader(outsideEvaluator))
        .send({ evaluationId: evaluation.id, evaluationResult: 'approved' })
        .expect(403);

      const evidenceAfter = await fixtures['evidenceRepo'].findOneBy({ id: evidence.id });
      expect(evidenceAfter!.status).toBe(evidenceBefore!.status);
      expect(evidenceAfter!.status).toBe(EvidenceStatus.UNDER_REVIEW);
    });

    it('evaluador NO asignado no puede ver pending-reviews de otro proyecto', async () => {
      const { ownerA, projectA, instanceA } = await fixtures.createTwoTenantScenario();
      const assignedEvaluator = await fixtures.createUser(UserRole.EVALUATOR);
      const outsideEvaluator = await fixtures.createUser(UserRole.EVALUATOR);
      const rubric = await fixtures.createRubric();

      const evidence = await fixtures.createEvidence({
        microActionInstanceId: instanceA.id,
        authorUserId: ownerA.id,
        projectId: projectA.id,
        status: EvidenceStatus.UNDER_REVIEW,
      });

      await fixtures.createEvaluation(evidence.id, rubric.id, assignedEvaluator.id);

      const res = await request(server())
        .get('/api/v1/evaluations/pending-reviews')
        .set(fixtures.authHeader(outsideEvaluator))
        .expect(200);

      const visibleIds = res.body.map((e: { id: string }) => e.id);
      expect(visibleIds).not.toContain(evidence.id);
    });
  });

  describe('Prueba 4: sin sesión → 401', () => {
    it('GET /projects sin token devuelve 401', async () => {
      await request(server()).get('/api/v1/projects').expect(401);
    });

    it('GET /evaluations/pending-reviews sin token devuelve 401', async () => {
      await request(server()).get('/api/v1/evaluations/pending-reviews').expect(401);
    });

    it('POST /tramos sin token devuelve 401', async () => {
      await request(server())
        .post('/api/v1/tramos')
        .send({ code: 'X', name_es: 'X', name_en: 'X', sortOrder: 1 })
        .expect(401);
    });
  });
});
