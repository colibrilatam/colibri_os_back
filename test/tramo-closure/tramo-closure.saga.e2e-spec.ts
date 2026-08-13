import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createTestApp, cleanDatabase, closeTestApp, E2eContext } from '../e2e-setup';
import { Fixtures } from '../fixtures';
import { TramoClosureService } from '../../src/tramo-closure/tramo-closure.service';
import { ReputationService } from '../../src/reputation/reputation.service';
import { NftProjectService } from '../../src/nfts/nft-project/nfts-project.service';
import { TramosService } from '../../src/tramos/tramos.service';
import { Project } from '../../src/projects/entities/project.entity';
import { EvidenceStatus } from '../../src/evidence/entities/evidence.entity';
import {
  TramoClosureOperation,
  TramoClosureStatus,
} from '../../src/tramo-closure/entities/tramo-closure-operation.entity';
import { UserRole } from '../../src/users/entities/user.entity';

describe('TramoClosureService — atomicidad e idempotencia (TX-001)', () => {
  let ctx: E2eContext;
  let dataSource: DataSource;
  let fixtures: Fixtures;
  let service: TramoClosureService;
  let reputationService: ReputationService;
  let nftProjectService: NftProjectService;
  let tramosService: TramosService;

  beforeAll(async () => {
    ctx = await createTestApp();
    dataSource = ctx.dataSource;
    service = ctx.app.get(TramoClosureService);
    reputationService = ctx.app.get(ReputationService);
    nftProjectService = ctx.app.get(NftProjectService);
    tramosService = ctx.app.get(TramosService);

    fixtures = new Fixtures(ctx.app);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await cleanDatabase(dataSource);
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  // Crea proyecto + tramo actual + tramo siguiente + 7 evidencias aprobadas,
  // listo para cerrar. Devuelve todo lo necesario para armar el DTO.
  async function buildReadyToCloseScenario() {
    const owner = await fixtures.createUser(UserRole.ENTREPRENEUR);
    const tramoActual = await fixtures.createTramo({ code: 'T1', sortOrder: 1 });
    const tramoSiguiente = await fixtures.createTramo({ code: 'T2', sortOrder: 2 });
    const project = await fixtures.createProject(owner.id, {
      currentTramoId: tramoActual.id,
    });

    const category = await fixtures.createCategory(tramoActual.id);
    const pac = await fixtures.createPac(category.id);
    const mad = await fixtures.createMicroActionDefinition(pac.id, {
      evidenceRequired: true,
    });

    for (let i = 0; i < 7; i++) {
      const instance = await fixtures.createMicroActionInstance(project.id, owner.id, mad.id);
      await fixtures.createEvidence({
        microActionInstanceId: instance.id,
        authorUserId: owner.id,
        projectId: project.id,
        status: EvidenceStatus.APPROVED,
        isValidForIc: true,
      });
    }

    return { owner, tramoActual, tramoSiguiente, project };
  }

  it('Prueba negativa: fallo después del snapshot revierte todo (no avanza tramo ni evoluciona NFT)', async () => {
    const { project, tramoActual } = await buildReadyToCloseScenario();

    jest
      .spyOn(nftProjectService, 'checkNftStatus')
      .mockRejectedValueOnce(new Error('Fallo simulado post-snapshot'));

    await expect(
      service.closeTramo({ projectId: project.id, tramoId: tramoActual.id }),
    ).rejects.toThrow('Fallo simulado post-snapshot');

    const projectRepo = ctx.app.get(getRepositoryToken(Project));
    const reloaded = await projectRepo.findOne({ where: { id: project.id } });
    expect(reloaded.currentTramoId).toBe(tramoActual.id); // no avanzó

    const opRepo = ctx.app.get(getRepositoryToken(TramoClosureOperation));
    const op = await opRepo.findOne({
      where: { idempotencyKey: `${project.id}:${tramoActual.id}` },
    });
    expect(op.status).toBe(TramoClosureStatus.FAILED); // estado recuperable, no silencioso
  });

  it('Prueba negativa: fallo durante evolución del NFT revierte snapshot y cambio de tramo', async () => {
    const { project, tramoActual } = await buildReadyToCloseScenario();

    jest
      .spyOn(nftProjectService, 'checkNftStatus')
      .mockResolvedValueOnce({ hasNft: true, nftProject: null });

    jest
      .spyOn(nftProjectService, 'evolveVisual')
      .mockRejectedValueOnce(new Error('Fallo simulado en evolución de NFT'));

    await expect(
      service.closeTramo({ projectId: project.id, tramoId: tramoActual.id }),
    ).rejects.toThrow();

    const projectRepo = ctx.app.get(getRepositoryToken(Project));
    const reloaded = await projectRepo.findOne({ where: { id: project.id } });
    expect(reloaded.currentTramoId).toBe(tramoActual.id); // el cambio de tramo también se revirtió
  });

  it('Prueba negativa: fallo antes de cambiar el tramo revierte snapshot y NFT', async () => {
    const { project, tramoActual } = await buildReadyToCloseScenario();

    jest
      .spyOn(tramosService, 'changeTramo')
      .mockRejectedValueOnce(new Error('Fallo simulado antes de cambiar tramo'));

    await expect(
      service.closeTramo({ projectId: project.id, tramoId: tramoActual.id }),
    ).rejects.toThrow();

    // El IC no debería quedar "colgado" apuntando a un cierre que no ocurrió
    const opRepo = ctx.app.get(getRepositoryToken(TramoClosureOperation));
    const op = await opRepo.findOne({
      where: { idempotencyKey: `${project.id}:${tramoActual.id}` },
    });
    expect(op.status).toBe(TramoClosureStatus.FAILED);
  });

  it('Prueba negativa: reintentar la misma operación no duplica efectos', async () => {
    const { project, tramoActual, tramoSiguiente } = await buildReadyToCloseScenario();

    const first = await service.closeTramo({
      projectId: project.id,
      tramoId: tramoActual.id,
    });
    expect(first.nextTramoId).toBe(tramoSiguiente.id);
    expect(first.replayed).toBe(false);

    const calculateSpy = jest.spyOn(reputationService, 'calculateSnapshot');

    const second = await service.closeTramo({
      projectId: project.id,
      tramoId: tramoActual.id,
    });

    expect(second).toEqual(first); // mismo resultado exacto, sin re-ejecutar
    expect(second.replayed).toBe(true);
    expect(calculateSpy).not.toHaveBeenCalled(); // no se volvió a calcular el snapshot
  });
});