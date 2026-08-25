// src/reputation/reputation.service.ts
import { Repository, DataSource, IsNull, EntityManager } from 'typeorm';
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IcAlgorithmVersion } from './entities/ic-algorithm-version.entity';
import {
  ReputationIndexSnapshot,
  EligibilityStatus,
} from './entities/reputation-index-snapshot.entity';
import { ReputationIndexExplanation } from './entities/reputation-index-explanation.entity';
import { Evidence, EvidenceStatus } from '../evidence/entities/evidence.entity';
import {
  MicroActionInstance,
  MicroActionInstanceStatus,
} from '../micro-action-instance/entities/micro-action-instance.entity';
import { Project } from '../projects/entities/project.entity';
import { CreateAlgorithmVersionDto } from './dto/create-algorithm-version.dto';
import { CalculateSnapshotDto } from './dto/calculate-snapshot.dto';

// REP-001: dimensiones que hoy no tienen una fuente de datos implementada.
// Mientras no se enriquezcan con las tablas fact del Grupo 5, su peso se
// redistribuye proporcionalmente entre las dimensiones con datos reales en
// vez de contarse como "mérito cero" del proyecto. Sacar una dimensión de
// esta lista en cuanto se implemente su fuente real.
const DIMENSIONS_WITHOUT_DATA_SOURCE = ['collaboration', 'sustainability'] as const;
type DimensionKey =
  | 'action'
  | 'evidence'
  | 'consistency'
  | 'collaboration'
  | 'sustainability';

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(
    @InjectRepository(IcAlgorithmVersion)
    private readonly algorithmRepo: Repository<IcAlgorithmVersion>,

    @InjectRepository(ReputationIndexSnapshot)
    private readonly snapshotRepo: Repository<ReputationIndexSnapshot>,

    @InjectRepository(ReputationIndexExplanation)
    private readonly explanationRepo: Repository<ReputationIndexExplanation>,

    @InjectRepository(Evidence)
    private readonly evidenceRepo: Repository<Evidence>,

    @InjectRepository(MicroActionInstance)
    private readonly instanceRepo: Repository<MicroActionInstance>,

    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    private readonly dataSource: DataSource,
  ) {}

  // ─── ALGORITMO ────────────────────────────────────────────────────────────

  async createAlgorithmVersion(dto: CreateAlgorithmVersionDto): Promise<IcAlgorithmVersion> {
    const existing = await this.algorithmRepo.findOne({
      where: { code: dto.code },
    });

    if (existing) {
      throw new BadRequestException(
        `Ya existe una versión del algoritmo con el código "${dto.code}"`,
      );
    }

    if (dto.isActive !== false) {
      await this.algorithmRepo.update({ isActive: true }, { isActive: false });
    }

    const version = this.algorithmRepo.create({
      ...dto,
      effectiveFrom: new Date(dto.effectiveFrom),
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : null,
      isActive: dto.isActive ?? true,
    } as IcAlgorithmVersion);

    return this.algorithmRepo.save(version);
  }

  async findActiveAlgorithm(): Promise<IcAlgorithmVersion> {
    const version = await this.algorithmRepo.findOne({
      where: { isActive: true },
    });

    if (!version) {
      throw new NotFoundException('No hay una versión activa del algoritmo del IC');
    }

    return version;
  }

  async findAllAlgorithmVersions(): Promise<IcAlgorithmVersion[]> {
    return this.algorithmRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOneAlgorithmVersion(id: string): Promise<IcAlgorithmVersion> {
    const version = await this.algorithmRepo.findOne({ where: { id } });

    if (!version) {
      throw new NotFoundException(`Versión de algoritmo ${id} no encontrada`);
    }

    return version;
  }

  // ─── MOTOR DE CÁLCULO DEL IC ────────────────────────────────────────────────

  async calculateSnapshot(
    dto: CalculateSnapshotDto,
    manager?: EntityManager,
  ): Promise<ReputationIndexSnapshot> {
    const project = await this.projectRepo.findOne({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException(`Proyecto ${dto.projectId} no encontrado`);
    }

    const algorithm = await this.findActiveAlgorithm();
    const userId = dto.userId ?? project.ownerUserId;
    const now = new Date();

    // ── Señales de entrada ───────────────────────────────────────────────────
    // REP-001 (pruebas negativas: "entradas de otro proyecto"): todos los
    // queries están filtrados por dto.projectId, no hay forma de que datos
    // de otro proyecto contaminen el cálculo.

    const allInstances = await this.instanceRepo.find({
      where: { projectId: dto.projectId },
    });

    const completedInstances = allInstances.filter((i) =>
      [
        MicroActionInstanceStatus.COMPLETED,
        MicroActionInstanceStatus.VALIDATED,
        MicroActionInstanceStatus.CLOSED,
      ].includes(i.status),
    );

    const onTimeInstances = completedInstances.filter((i) => i.isOnTime === true);

    // REP-001 (pruebas negativas: "evidencias duplicadas"): se deduplica por
    // id de evidencia antes de contar. TypeORM no debería devolver duplicados
    // en un find() simple, pero si en el futuro se agregan joins que multipliquen
    // filas, esta guarda evita inflar/deflar el score silenciosamente.
    const allEvidencesRaw = await this.evidenceRepo.find({
      where: { projectId: dto.projectId },
    });
    const allEvidences = this.deduplicateById(allEvidencesRaw);

    const approvedEvidences = allEvidences.filter(
      (e) => e.status === EvidenceStatus.APPROVED && e.isValidForIc,
    );

    const rejectedEvidences = allEvidences.filter((e) => e.status === EvidenceStatus.REJECTED);

    // ── Cálculo de dimensiones (datos incompletos → score 0, no error) ───────
    // REP-001 (pruebas negativas: "datos incompletos"): un proyecto sin
    // microacciones o sin evidencias no debe romper el cálculo; su score en
    // esa dimensión es 0 y queda documentado en la explicación granular.

    const actionScore =
      allInstances.length > 0 ? (completedInstances.length / allInstances.length) * 100 : 0;

    const submittedEvidences = allEvidences.filter((e) => e.status !== EvidenceStatus.DRAFT);
    const evidenceScore =
      submittedEvidences.length > 0
        ? (approvedEvidences.length / submittedEvidences.length) * 100
        : 0;

    const consistencyScore =
      completedInstances.length > 0
        ? (onTimeInstances.length / completedInstances.length) * 100
        : 0;

    // Colaboración y sostenibilidad: sin fuente de datos implementada todavía
    // (ver DIMENSIONS_WITHOUT_DATA_SOURCE). Se calculan en 0 pero su peso NO
    // se aplica tal cual — se redistribuye (ver más abajo).
    const collaborationScore = 0;
    const sustainabilityScore = 0;

    const rawScores: Record<DimensionKey, number> = {
      action: actionScore,
      evidence: evidenceScore,
      consistency: consistencyScore,
      collaboration: collaborationScore,
      sustainability: sustainabilityScore,
    };

    const rawWeights: Record<DimensionKey, number> = {
      action: Number(algorithm.weightAction),
      evidence: Number(algorithm.weightEvidence),
      consistency: Number(algorithm.weightConsistency),
      collaboration: Number(algorithm.weightCollaboration),
      sustainability: Number(algorithm.weightSustainability),
    };

    // ── Redistribución de pesos sin fuente de datos ──────────────────────────
    const { effectiveWeights, redistribution } = this.redistributeWeights(rawWeights);

    // ── IC bruto ponderado (con pesos ya redistribuidos) ─────────────────────
    const icRaw = (Object.keys(rawScores) as DimensionKey[]).reduce(
      (acc, key) => acc + (rawScores[key] * effectiveWeights[key]) / 100,
      0,
    );

    const icPublic = Math.min(Math.round(icRaw * 100) / 100, 100);

    // ── Elegibilidad ─────────────────────────────────────────────────────────
    const eligibilityStatus =
      icPublic >= 60 ? EligibilityStatus.ELIGIBLE : EligibilityStatus.NOT_ELIGIBLE;

    // ── Persistencia en transacción ──────────────────────────────────────────
    const persist = async (m: EntityManager) => {
      await m.update(
        ReputationIndexSnapshot,
        { projectId: dto.projectId, validTo: IsNull() },
        { validTo: now },
      );

      const newSnapshot = m.create(ReputationIndexSnapshot, {
        projectId: dto.projectId,
        userId,
        tramoId: project.currentTramoId ?? null,
        algorithmVersionId: algorithm.id,
        actionScore,
        evidenceScore,
        consistencyScore,
        collaborationScore,
        sustainabilityScore,
        icRaw,
        icPublic,
        eligibilityStatus,
        calculatedAt: now,
        validFrom: now,
        validTo: null,
        explanationJson: {
          algorithmVersionCode: algorithm.code,
          rawWeights,
          effectiveWeights,
          redistribution,
        },
      } as unknown as ReputationIndexSnapshot);

      const saved = await m.save(ReputationIndexSnapshot, newSnapshot);

      const explanations: Partial<ReputationIndexExplanation>[] = [
        {
          snapshotId: saved.id,
          metricKey: 'action_score',
          sourceEntity: 'micro_action_instance',
          sourceEntityId: dto.projectId,
          contributionValue: actionScore,
          notes: `${completedInstances.length} de ${allInstances.length} microacciones completadas. Peso efectivo: ${effectiveWeights.action}%`,
        },
        {
          snapshotId: saved.id,
          metricKey: 'evidence_score',
          sourceEntity: 'evidence',
          sourceEntityId: dto.projectId,
          contributionValue: evidenceScore,
          notes: `${approvedEvidences.length} evidencias aprobadas, ${rejectedEvidences.length} rechazadas. Peso efectivo: ${effectiveWeights.evidence}%`,
        },
        {
          snapshotId: saved.id,
          metricKey: 'consistency_score',
          sourceEntity: 'micro_action_instance',
          sourceEntityId: dto.projectId,
          contributionValue: consistencyScore,
          notes: `${onTimeInstances.length} de ${completedInstances.length} completadas a tiempo. Peso efectivo: ${effectiveWeights.consistency}%`,
        },
        ...DIMENSIONS_WITHOUT_DATA_SOURCE.map((dim) => ({
          snapshotId: saved.id,
          metricKey: `${dim}_score`,
          sourceEntity: 'no_data_source',
          sourceEntityId: dto.projectId,
          contributionValue: 0,
          notes: `Sin fuente de datos implementada (REP-001). Peso original ${rawWeights[dim]}% redistribuido entre las dimensiones con datos.`,
        })),
      ];

      await m.save(ReputationIndexExplanation, explanations);

      return saved;
    };

    if (manager) {
      await persist(manager);
    } else {
      await this.dataSource.transaction(persist);
    }

    this.logger.log(
      `IC calculado para proyecto ${dto.projectId} — IC público: ${icPublic} — algoritmo: ${algorithm.code}` +
        (redistribution.redistributedPercentagePoints > 0
          ? ` — redistribuidos ${redistribution.redistributedPercentagePoints}pp de pesos sin fuente`
          : ''),
    );

    return this.findLatestSnapshot(dto.projectId, manager);
  }

  /**
   * REP-001: redistribuye proporcionalmente el peso de las dimensiones sin
   * fuente de datos (DIMENSIONS_WITHOUT_DATA_SOURCE) entre las dimensiones
   * que sí tienen datos, en vez de dejar que ese peso "castigue" el índice
   * multiplicando por un score en 0 que no refleja mérito real.
   *
   * Si algún día TODAS las dimensiones quedan sin fuente (caso degenerado),
   * no se redistribuye nada y el IC queda en 0 — se documenta explícitamente
   * en vez de fallar en silencio.
   */
  private redistributeWeights(rawWeights: Record<DimensionKey, number>): {
    effectiveWeights: Record<DimensionKey, number>;
    redistribution: {
      dimensionsWithoutSource: string[];
      redistributedPercentagePoints: number;
      basis: 'proportional-to-existing-weights' | 'none';
    };
  } {
    const withoutSource = new Set<DimensionKey>(
      DIMENSIONS_WITHOUT_DATA_SOURCE as readonly DimensionKey[],
    );

    const weightToRedistribute = (Object.keys(rawWeights) as DimensionKey[])
      .filter((k) => withoutSource.has(k))
      .reduce((acc, k) => acc + rawWeights[k], 0);

    const totalWeightWithSource = (Object.keys(rawWeights) as DimensionKey[])
      .filter((k) => !withoutSource.has(k))
      .reduce((acc, k) => acc + rawWeights[k], 0);

    const effectiveWeights = { ...rawWeights };

    if (weightToRedistribute > 0 && totalWeightWithSource > 0) {
      for (const key of Object.keys(rawWeights) as DimensionKey[]) {
        if (withoutSource.has(key)) {
          effectiveWeights[key] = 0;
        } else {
          const proportion = rawWeights[key] / totalWeightWithSource;
          effectiveWeights[key] = rawWeights[key] + weightToRedistribute * proportion;
        }
      }
    }

    return {
      effectiveWeights,
      redistribution: {
        dimensionsWithoutSource: Array.from(withoutSource),
        redistributedPercentagePoints:
          weightToRedistribute > 0 && totalWeightWithSource > 0 ? weightToRedistribute : 0,
        basis:
          weightToRedistribute > 0 && totalWeightWithSource > 0
            ? 'proportional-to-existing-weights'
            : 'none',
      },
    };
  }

  private deduplicateById<T extends { id: string }>(items: T[]): T[] {
    const seen = new Map<string, T>();
    for (const item of items) {
      seen.set(item.id, item);
    }
    return Array.from(seen.values());
  }

  // ─── CONSULTAS ────────────────────────────────────────────────────────────

  async findLatestSnapshot(
    projectId: string,
    manager?: EntityManager,
  ): Promise<ReputationIndexSnapshot> {
    const repo = manager ? manager.getRepository(ReputationIndexSnapshot) : this.snapshotRepo;

    const snapshot = await repo.findOne({
      where: { projectId, validTo: IsNull() },
      relations: ['algorithmVersion', 'explanations', 'tramo'],
      order: { calculatedAt: 'DESC' },
    });

    if (!snapshot) {
      throw new NotFoundException(
        `No se encontró snapshot reputacional para el proyecto ${projectId}`,
      );
    }

    return snapshot;
  }

  async findSnapshotHistory(projectId: string): Promise<ReputationIndexSnapshot[]> {
    return this.snapshotRepo.find({
      where: { projectId },
      relations: ['algorithmVersion', 'tramo'],
      order: { calculatedAt: 'DESC' },
    });
  }

  async findSnapshotWithExplanations(snapshotId: string): Promise<ReputationIndexSnapshot> {
    const snapshot = await this.snapshotRepo.findOne({
      where: { id: snapshotId },
      relations: ['algorithmVersion', 'explanations', 'tramo', 'project'],
    });

    if (!snapshot) {
      throw new NotFoundException(`Snapshot ${snapshotId} no encontrado`);
    }

    return snapshot;
  }
}