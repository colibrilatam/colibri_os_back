import request from 'supertest';
import {
  createTestApp,
  cleanDatabase,
  closeTestApp,
  E2eContext,
} from './e2e-setup';
import { Fixtures } from './fixtures';
import { UserRole } from 'src/users/entities/user.entity';
import {
  EvidenceStatus,
} from 'src/evidence/entities/evidence.entity';

describe('BE-002 — Tramo Closure Security', () => {
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

  async function buildReadyScenario() {
    const owner = await fixtures.createUser(UserRole.ENTREPRENEUR);
    const unauthorizedMember = await fixtures.createUser(UserRole.MENTOR);

    const tramoActual = await fixtures.createTramo({
      code: 'T1',
      sortOrder: 1,
      isActive: true,
    });

    const tramoSiguiente = await fixtures.createTramo({
      code: 'T2',
      sortOrder: 2,
      isActive: true,
    });

    const project = await fixtures.createProject(owner.id, {
      currentTramoId: tramoActual.id,
    });

    await fixtures.addProjectMember(
      project.id,
      unauthorizedMember.id,
      {
        isPrimaryOperator: false,
      },
    );

    const category = await fixtures.createCategory(tramoActual.id);
    const pac = await fixtures.createPac(category.id);

    const mad = await fixtures.createMicroActionDefinition(pac.id, {
      evidenceRequired: true,
    });

    for (let i = 0; i < 7; i++) {
      const instance = await fixtures.createMicroActionInstance(
        project.id,
        owner.id,
        mad.id,
      );

      await fixtures.createEvidence({
        microActionInstanceId: instance.id,
        authorUserId: owner.id,
        projectId: project.id,
        status: EvidenceStatus.APPROVED,
        isValidForIc: true,
      });
    }

    return {
      owner,
      unauthorizedMember,
      project,
      tramoActual,
      tramoSiguiente,
    };
  }

  it('rechaza cerrar un tramo sin autenticación', async () => {
    const {
      project,
      tramoActual,
    } = await buildReadyScenario();

    await request(server())
      .post('/api/v1/tramo-closure/close')
      .send({
        projectId: project.id,
        tramoId: tramoActual.id,
      })
      .expect(401);
  });

  it('rechaza cerrar un tramo desde un miembro no autorizado', async () => {
    const {
      project,
      tramoActual,
      unauthorizedMember,
    } = await buildReadyScenario();

    await request(server())
      .post('/api/v1/tramo-closure/close')
      .set(fixtures.authHeader(unauthorizedMember))
      .send({
        projectId: project.id,
        tramoId: tramoActual.id,
      })
      .expect(403);
  });

  it('permite cerrar el tramo al dueño del proyecto', async () => {
    const {
      project,
      tramoActual,
      tramoSiguiente,
      owner,
    } = await buildReadyScenario();

    const response = await request(server())
      .post('/api/v1/tramo-closure/close')
      .set(fixtures.authHeader(owner))
      .send({
        projectId: project.id,
        tramoId: tramoActual.id,
      })
      .expect(200);

    expect(response.body.projectId).toBe(project.id);
    expect(response.body.closedTramoId).toBe(tramoActual.id);
    expect(response.body.nextTramoId).toBe(tramoSiguiente.id);
    expect(response.body.requestedByUserId).toBe(owner.id);
    expect(response.body.replayed).toBe(false);

    expect(response.body.previousState.tramoId).toBe(tramoActual.id);
    expect(response.body.previousState.tramoCode).toBe('T1');

    expect(response.body.nextState.tramoId).toBe(tramoSiguiente.id);
    expect(response.body.nextState.tramoCode).toBe('T2');
  });

  it('rechaza una transición inválida después de que el tramo ya fue cerrado', async () => {
    const {
      project,
      tramoActual,
      tramoSiguiente,
      owner,
    } = await buildReadyScenario();

    await request(server())
      .post('/api/v1/tramo-closure/close')
      .set(fixtures.authHeader(owner))
      .send({
        projectId: project.id,
        tramoId: tramoActual.id,
        idempotencyKey: 'be002-first-close',
      })
      .expect(200);

    // Intentamos volver a cerrar T1 usando otra idempotencyKey.
    // La operación NO debe convertirse en un replay.
    await request(server())
      .post('/api/v1/tramo-closure/close')
      .set(fixtures.authHeader(owner))
      .send({
        projectId: project.id,
        tramoId: tramoActual.id,
        idempotencyKey: 'be002-invalid-transition',
      })
      .expect(400);

    const projectRow = await ctx.dataSource.query(
      `
      SELECT current_tramo_id
      FROM projects
      WHERE id = $1
      `,
      [project.id],
    );

    expect(projectRow[0].current_tramo_id).toBe(
      tramoSiguiente.id,
    );
  });

  it('repetir la misma operación es idempotente', async () => {
    const {
      project,
      tramoActual,
      owner,
    } = await buildReadyScenario();

    const payload = {
      projectId: project.id,
      tramoId: tramoActual.id,
      idempotencyKey: 'be002-idempotent-operation',
    };

    const first = await request(server())
      .post('/api/v1/tramo-closure/close')
      .set(fixtures.authHeader(owner))
      .send(payload)
      .expect(200);

    const second = await request(server())
      .post('/api/v1/tramo-closure/close')
      .set(fixtures.authHeader(owner))
      .send(payload)
      .expect(200);

    expect(second.body).toEqual({
      ...first.body,
      replayed: true,
    });

    const operations = await ctx.dataSource.query(
      `
      SELECT id, status, requested_by_user_id
      FROM tramo_closure_operations
      WHERE idempotency_key = $1
      `,
      [payload.idempotencyKey],
    );

    expect(operations).toHaveLength(1);
    expect(operations[0].status).toBe('completed');
    expect(operations[0].requested_by_user_id).toBe(owner.id);
  });

  it('audita el estado anterior y posterior del cierre', async () => {
    const {
      project,
      tramoActual,
      tramoSiguiente,
      owner,
    } = await buildReadyScenario();

    const response = await request(server())
      .post('/api/v1/tramo-closure/close')
      .set(fixtures.authHeader(owner))
      .send({
        projectId: project.id,
        tramoId: tramoActual.id,
        idempotencyKey: 'be002-audit',
      })
      .expect(200);

    const operationRows = await ctx.dataSource.query(
      `
      SELECT
        requested_by_user_id,
        status,
        result_payload
      FROM tramo_closure_operations
      WHERE idempotency_key = $1
      `,
      ['be002-audit'],
    );

    expect(operationRows).toHaveLength(1);
    expect(operationRows[0].requested_by_user_id).toBe(owner.id);
    expect(operationRows[0].status).toBe('completed');

    expect(operationRows[0].result_payload.previousState.tramoId).toBe(
      tramoActual.id,
    );

    expect(operationRows[0].result_payload.nextState.tramoId).toBe(
      tramoSiguiente.id,
    );

    const history = await ctx.dataSource.query(
      `
      SELECT
        tramo_id,
        changed_by_user_id,
        left_at
      FROM project_tramo_history
      WHERE project_id = $1
      ORDER BY entered_at ASC
      `,
      [project.id],
    );

    expect(history).toHaveLength(2);

    expect(history[0].tramo_id).toBe(tramoActual.id);
    expect(history[0].changed_by_user_id).toBeNull();
    expect(history[0].left_at).not.toBeNull();

    expect(history[1].tramo_id).toBe(tramoSiguiente.id);
    expect(history[1].changed_by_user_id).toBe(owner.id);
    expect(history[1].left_at).toBeNull();

    expect(response.body.previousState.tramoId).toBe(
      tramoActual.id,
    );

    expect(response.body.nextState.tramoId).toBe(
      tramoSiguiente.id,
    );
  });

  it('rechaza reutilizar una idempotencyKey para otro proyecto o tramo', async () => {
    const first = await buildReadyScenario();

    await request(server())
      .post('/api/v1/tramo-closure/close')
      .set(fixtures.authHeader(first.owner))
      .send({
        projectId: first.project.id,
        tramoId: first.tramoActual.id,
        idempotencyKey: 'be002-reused-key',
      })
      .expect(200);

    const second = await buildReadyScenario();

    await request(server())
      .post('/api/v1/tramo-closure/close')
      .set(fixtures.authHeader(second.owner))
      .send({
        projectId: second.project.id,
        tramoId: second.tramoActual.id,
        idempotencyKey: 'be002-reused-key',
      })
      .expect(409);
  });
});