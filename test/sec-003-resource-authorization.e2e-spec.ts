import request from 'supertest';
import { createTestApp, cleanDatabase, closeTestApp, E2eContext } from './e2e-setup';
import { Fixtures } from './fixtures';
import { UserRole } from 'src/users/entities/user.entity';
import { EvidenceStatus } from 'src/evidence/entities/evidence.entity';

describe('SEC-003 — autorización por recurso: propiedad, membresía y asignación (e2e)', () => {
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

  async function submittedEvidenceWithEvaluation(evaluatorA) {
    const { instanceA, ownerA, projectA } = await fixtures.createTwoTenantScenario();
    await fixtures.addProjectMember(projectA.id, evaluatorA.id);

    const rubric = await fixtures.createRubric();
    const evidence = await fixtures.createEvidence({
      microActionInstanceId: instanceA.id,
      authorUserId: ownerA.id,
      projectId: instanceA.projectId,
      status: EvidenceStatus.SUBMITTED,
    });

    const createRes = await request(server())
      .post('/api/v1/evaluations')
      .set(fixtures.authHeader(evaluatorA))
      .send({ evidenceId: evidence.id, rubricId: rubric.id });

    return { projectA, evidence, evaluationId: createRes.body.id };
  }

  describe('Negativa 1 — dos usuarios con el mismo rol intentan modificar recursos entre sí', () => {
    it('403 cuando un ENTREPRENEUR intenta editar el proyecto de otro ENTREPRENEUR', async () => {
      const { projectA } = await fixtures.createTwoTenantScenario();
      const otherEntrepreneur = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .patch(`/api/v1/projects/${projectA.id}`)
        .set(fixtures.authHeader(otherEntrepreneur))
        .send({ name: 'Nombre hackeado' })
        .expect(403);
    });

    it('403 cuando un EVALUATOR revisa la evaluación abierta por otro EVALUATOR del mismo proyecto', async () => {
      const evaluatorA = await fixtures.createUser(UserRole.EVALUATOR);
      const evaluatorB = await fixtures.createUser(UserRole.EVALUATOR);
      const { projectA, evaluationId } = await submittedEvidenceWithEvaluation(evaluatorA);
      await fixtures.addProjectMember(projectA.id, evaluatorB.id);

      // evaluatorB SÍ tiene acceso al proyecto — la falla debe venir de la
      // asignación, no de la membresía.
      await request(server())
        .post('/api/v1/evaluations/human-review')
        .set(fixtures.authHeader(evaluatorB))
        .send({ evaluationId, reviewDecision: 'approved' })
        .expect(403);
    });
  });

  describe('Negativa 2 — accionar sobre el "tenant" de otro (proyecto ajeno; no existe org en el modelo)', () => {
    it('403 cuando un EVALUATOR miembro del proyecto B intenta registrar review sobre una evaluación del proyecto A', async () => {
      const evaluatorA = await fixtures.createUser(UserRole.EVALUATOR);
      const { projectB, evaluationId } = await (async () => {
        const scenario = await fixtures.createTwoTenantScenario();
        await fixtures.addProjectMember(scenario.projectA.id, evaluatorA.id);

        const rubric = await fixtures.createRubric();
        const evidence = await fixtures.createEvidence({
          microActionInstanceId: scenario.instanceA.id,
          authorUserId: scenario.ownerA.id,
          projectId: scenario.instanceA.projectId,
          status: EvidenceStatus.SUBMITTED,
        });

        const createRes = await request(server())
          .post('/api/v1/evaluations')
          .set(fixtures.authHeader(evaluatorA))
          .send({ evidenceId: evidence.id, rubricId: rubric.id });

        return { projectB: scenario.projectB, evaluationId: createRes.body.id };
      })();

      const evaluatorOfB = await fixtures.createUser(UserRole.EVALUATOR);
      await fixtures.addProjectMember(projectB.id, evaluatorOfB.id);

      await request(server())
        .post('/api/v1/evaluations/human-review')
        .set(fixtures.authHeader(evaluatorOfB))
        .send({ evaluationId, reviewDecision: 'approved' })
        .expect(403);
    });
  });

  describe('Negativa 3 — un evaluador no asignado intenta aprobar una evidencia', () => {
    it('403 al registrar revisión humana sin ser el evaluador asignado', async () => {
      const evaluatorA = await fixtures.createUser(UserRole.EVALUATOR);
      const mentorB = await fixtures.createUser(UserRole.MENTOR);
      const { projectA, evaluationId } = await submittedEvidenceWithEvaluation(evaluatorA);
      await fixtures.addProjectMember(projectA.id, mentorB.id);

      await request(server())
        .post('/api/v1/evaluations/human-review')
        .set(fixtures.authHeader(mentorB))
        .send({ evaluationId, reviewDecision: 'approved' })
        .expect(403);
    });

    it('200 cuando el evaluador asignado sí registra su revisión', async () => {
      const evaluatorA = await fixtures.createUser(UserRole.EVALUATOR);
      const { evaluationId } = await submittedEvidenceWithEvaluation(evaluatorA);

      await request(server())
        .post('/api/v1/evaluations/human-review')
        .set(fixtures.authHeader(evaluatorA))
        .send({ evaluationId, reviewDecision: 'approved' })
        .expect(200);
    });

    it('200 cuando ADMIN registra revisión aunque no sea el evaluador asignado', async () => {
      const evaluatorA = await fixtures.createUser(UserRole.EVALUATOR);
      const admin = await fixtures.createUser(UserRole.ADMIN);
      const { evaluationId } = await submittedEvidenceWithEvaluation(evaluatorA);

      await request(server())
        .post('/api/v1/evaluations/human-review')
        .set(fixtures.authHeader(admin))
        .send({ evaluationId, reviewDecision: 'approved' })
        .expect(200);
    });

    it('el rechazo queda auditado en authorization_denial_audits', async () => {
      const evaluatorA = await fixtures.createUser(UserRole.EVALUATOR);
      const mentorB = await fixtures.createUser(UserRole.MENTOR);
      const { projectA, evaluationId } = await submittedEvidenceWithEvaluation(evaluatorA);
      await fixtures.addProjectMember(projectA.id, mentorB.id);

      await request(server())
        .post('/api/v1/evaluations/human-review')
        .set(fixtures.authHeader(mentorB))
        .send({ evaluationId, reviewDecision: 'approved' });

      const rows = await ctx.dataSource.query(
        `SELECT * FROM authorization_denial_audits
         WHERE resource_type = 'evaluation' AND resource_id = $1 AND reason = 'not_assigned_evaluator'`,
        [evaluationId],
      );
      expect(rows.length).toBe(1);
      expect(rows[0].attempted_by_user_id).toBe(mentorB.id);
    });
  });
});