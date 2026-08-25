import request from 'supertest';
import { createTestApp, cleanDatabase, closeTestApp, E2eContext } from './e2e-setup';
import { Fixtures } from './fixtures';
import { UserRole, UserStatus } from 'src/users/entities/user.entity';
import { EvidenceStatus } from 'src/evidence/entities/evidence.entity';

/**
 * QA-001 — Pruebas automatizadas de permisos por rol, proyecto, propiedad,
 * asignación y visibilidad.
 *
 * Este archivo cubre específicamente las 5 categorías de prueba negativa
 * pedidas en la tarjeta QA-001:
 *   1. Sin autenticación
 *   2. Rol incorrecto
 *   3. Recurso ajeno (propiedad)
 *   4. Proyecto/organización incorrecta (no existe "org" en el modelo: el
 *      límite de tenant es el proyecto — ver también sec-003)
 *   5. Estado de recurso inválido
 *
 * y, para cada caso de rechazo, verifica el criterio de aceptación:
 * "la base de datos no cambia tras un 403" (comparando una foto del recurso
 * antes y después de la request rechazada).
 *
 * No reemplaza las suites existentes (sec-002, sec-003, *-authorization) —
 * las complementa agregando el chequeo de integridad de datos que faltaba.
 */
describe('QA-001 — matriz de pruebas negativas y verificación de integridad de datos (e2e)', () => {
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

  // ─── 1. Sin autenticación ──────────────────────────────────────────────────

  describe('Negativa — sin autenticación', () => {
    it('401 al intentar actualizar un proyecto sin token, y el proyecto no cambia en DB', async () => {
      const owner = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const project = await fixtures.createProject(owner.id, { projectName: 'Nombre original' });

      await request(server())
        .patch(`/api/v1/projects/${project.id}`)
        .send({ projectName: 'Nombre inyectado sin token' })
        .expect(401);

      const rows = await ctx.dataSource.query(
        `SELECT project_name, updated_at FROM projects WHERE id = $1`,
        [project.id],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].project_name).toBe('Nombre original');
    });
  });

  // ─── 2. Rol incorrecto ──────────────────────────────────────────────────────

  describe('Negativa — rol incorrecto', () => {
    it('403 cuando un no-ADMIN intenta cambiar el rol de otro usuario, y no se modifica el rol ni se crea auditoría', async () => {
      const evaluator = await fixtures.createUser(UserRole.EVALUATOR);
      const target = await fixtures.createUser(UserRole.MENTOR);

      await request(server())
        .patch(`/api/v1/users/${target.id}/role`)
        .set(fixtures.authHeader(evaluator))
        .send({ role: UserRole.ADMIN, reason: 'Intento no autorizado' })
        .expect(403);

      const userRows = await ctx.dataSource.query(`SELECT role FROM users WHERE id = $1`, [
        target.id,
      ]);
      expect(userRows[0].role).toBe(UserRole.MENTOR);

      const auditRows = await ctx.dataSource.query(
        `SELECT * FROM user_role_change_audits WHERE target_user_id = $1`,
        [target.id],
      );
      expect(auditRows).toHaveLength(0);
    });
  });

  // ─── 3. Recurso ajeno (propiedad) ──────────────────────────────────────────

  describe('Negativa — recurso ajeno', () => {
    it('403 cuando un usuario intenta editar la evidencia de otro autor, y la evidencia no cambia en DB', async () => {
      const mad = await fixtures.createCurriculumChain();
      const owner = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const project = await fixtures.createProject(owner.id);
      const instance = await fixtures.createMicroActionInstance(project.id, owner.id, mad.id);
      const evidence = await fixtures.createEvidence({
        microActionInstanceId: instance.id,
        authorUserId: owner.id,
        projectId: project.id,
        description: 'Descripción original',
        status: EvidenceStatus.DRAFT,
      });

      const intruder = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .patch(`/api/v1/evidence/${evidence.id}`)
        .set(fixtures.authHeader(intruder))
        .send({ description: 'Descripción hackeada' })
        .expect(403);

      const rows = await ctx.dataSource.query(
        `SELECT description, status, updated_at FROM evidences WHERE id = $1`,
        [evidence.id],
      );
      expect(rows[0].description).toBe('Descripción original');
      expect(rows[0].status).toBe(EvidenceStatus.DRAFT);
    });
  });

  // ─── 4. Proyecto ajeno (límite de "tenant") ────────────────────────────────

  describe('Negativa — proyecto ajeno (no existe org: el tenant es el proyecto)', () => {
    it('403 cuando un EVALUATOR del proyecto B revisa una evaluación del proyecto A, y la evaluación no cambia en DB', async () => {
      const evaluatorA = await fixtures.createUser(UserRole.EVALUATOR);
      const scenario = await fixtures.createTwoTenantScenario();
      await fixtures.addProjectMember(scenario.projectA.id, evaluatorA.id);

      const rubric = await fixtures.createRubric();
      const evidence = await fixtures.createEvidence({
        microActionInstanceId: scenario.instanceA.id,
        authorUserId: scenario.ownerA.id,
        projectId: scenario.projectA.id,
        status: EvidenceStatus.SUBMITTED,
      });

      const createRes = await request(server())
        .post('/api/v1/evaluations')
        .set(fixtures.authHeader(evaluatorA))
        .send({ evidenceId: evidence.id, rubricId: rubric.id });
      const evaluationId = createRes.body.id;

      // La revisión humana vive en una tabla aparte (evaluation_human_reviews)
      // y solo se crea si la request tiene éxito: el criterio de "DB sin
      // cambios tras 403" acá es que esa tabla siga sin filas para esta evaluación.
      const evaluatorOfB = await fixtures.createUser(UserRole.EVALUATOR);
      await fixtures.addProjectMember(scenario.projectB.id, evaluatorOfB.id);

      await request(server())
        .post('/api/v1/evaluations/human-review')
        .set(fixtures.authHeader(evaluatorOfB))
        .send({ evaluationId, reviewDecision: 'approved' })
        .expect(403);

      const reviews = await ctx.dataSource.query(
        `SELECT * FROM evaluation_human_reviews WHERE evaluation_id = $1`,
        [evaluationId],
      );
      expect(reviews).toHaveLength(0);

      const evaluationRows = await ctx.dataSource.query(
        `SELECT "is_final" FROM evaluations WHERE id = $1`,
        [evaluationId],
      );
      expect(evaluationRows[0].is_final).toBe(false);
    });
  });

  // ─── 5. Estado de recurso inválido ─────────────────────────────────────────

  describe('Negativa — estado de recurso inválido', () => {
    it('400 al reenviar una evidencia que ya está en revisión, y la evidencia no cambia en DB', async () => {
      const mad = await fixtures.createCurriculumChain();
      const owner = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const project = await fixtures.createProject(owner.id);
      const instance = await fixtures.createMicroActionInstance(project.id, owner.id, mad.id);
      const evidence = await fixtures.createEvidence({
        microActionInstanceId: instance.id,
        authorUserId: owner.id,
        projectId: project.id,
        status: EvidenceStatus.SUBMITTED, // ya no es "draft" ni "rejected": no editable
      });

      const before = await ctx.dataSource.query(
        `SELECT status, submitted_at, updated_at FROM evidences WHERE id = $1`,
        [evidence.id],
      );

      await request(server())
        .post(`/api/v1/evidence/${evidence.id}/submit`)
        .set(fixtures.authHeader(owner))
        .expect(400);

      const after = await ctx.dataSource.query(
        `SELECT status, submitted_at, updated_at FROM evidences WHERE id = $1`,
        [evidence.id],
      );
      expect(after).toEqual(before);
    });
  });

  // ─── Extra: usuario suspendido (visibilidad de sesión) ─────────────────────

  describe('Negativa — cuenta suspendida', () => {
    it('401/403 cuando un usuario suspendido intenta usar un token emitido antes de la suspensión', async () => {
      const user = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const token = fixtures.authHeader(user);
      const project = await fixtures.createProject(user.id, { projectName: 'Antes de suspender' });

      await fixtures.setUserStatus(user.id, UserStatus.SUSPENDED);

      const res = await request(server())
        .patch(`/api/v1/projects/${project.id}`)
        .set(token)
        .send({ projectName: 'No debería aplicarse' });

      expect([401, 403]).toContain(res.status);

      const rows = await ctx.dataSource.query(`SELECT project_name FROM projects WHERE id = $1`, [
        project.id,
      ]);
      expect(rows[0].project_name).toBe('Antes de suspender');
    });
  });
});