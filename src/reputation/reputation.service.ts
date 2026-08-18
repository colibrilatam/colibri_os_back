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

  // ─── ALGORITMO ────────────────────────────────────────────────────────────────

  async createAlgorithmVersion(dto: CreateAlgorithmVersionDto): Promise<IcAlgorithmVersion> {
    const existing = await this.algorithmRepo.findOne({
      where: { code: dto.code },
    });

    if (existing) {
      throw new BadRequestException(
        `Ya existe una versión del algoritmo con el código "${dto.code}"`,
      );
    }

    // Si la nueva versión es activa, desactivamos la anterior
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

  // ─── MOTOR DE CÁLCULO DEL IC ──────────────────────────────────────────────────
  // Acepta un EntityManager opcional para poder participar en una
  // transacción externa (ej. el cierre de tramo, que necesita que el
  // snapshot, la evolución del NFT y el cambio de tramo se confirmen o se
  // reviertan todos juntos — ver TX-001).

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

    const allInstances = await this.instanceRepo.find({
      where: { projectId: dto.projectId },
    });

    const completedInstances = allInstances.filter((i) =>
      [
        MicroActionInstanceStatus.COMPLETED,
      ].includes(i.status),
    );

    const onTimeInstances = completedInstances.filter((i) => i.isOnTime === true);

    const allEvidences = await this.evidenceRepo.find({
      where: { projectId: dto.projectId },
    });

    const approvedEvidences = allEvidences.filter(
      (e) => e.status === EvidenceStatus.APPROVED && e.isValidForIc,
    );

    const rejectedEvidences = allEvidences.filter((e) => e.status === EvidenceStatus.REJECTED);

    // ── Cálculo de dimensiones ───────────────────────────────────────────────

    // Acción: % de microacciones completadas sobre el total
    const actionScore =
      allInstances.length > 0 ? (completedInstances.length / allInstances.length) * 100 : 0;

    // Evidencia: % de evidencias aprobadas sobre las enviadas
    const submittedEvidences = allEvidences.filter((e) => e.status !== EvidenceStatus.DRAFT);
    const evidenceScore =
      submittedEvidences.length > 0
        ? (approvedEvidences.length / submittedEvidences.length) * 100
        : 0;

    // Constancia: % de microacciones completadas a tiempo
    const consistencyScore =
      completedInstances.length > 0
        ? (onTimeInstances.length / completedInstances.length) * 100
        : 0;

    // Colaboración y sostenibilidad: base 0 por ahora
    // Se enriquecerán con las tablas fact del Grupo 5
    const collaborationScore = 0;
    const sustainabilityScore = 0;

    // ── IC bruto ponderado ───────────────────────────────────────────────────

    const icRaw =
      (actionScore * Number(algorithm.weightAction)) / 100 +
      (evidenceScore * Number(algorithm.weightEvidence)) / 100 +
      (consistencyScore * Number(algorithm.weightConsistency)) / 100 +
      (collaborationScore * Number(algorithm.weightCollaboration)) / 100 +
      (sustainabilityScore * Number(algorithm.weightSustainability)) / 100;

    const icPublic = Math.min(Math.round(icRaw * 100) / 100, 100);

    // ── Elegibilidad ─────────────────────────────────────────────────────────

    const eligibilityStatus =
      icPublic >= 60 ? EligibilityStatus.ELIGIBLE : EligibilityStatus.NOT_ELIGIBLE;

    // ── Persistencia en transacción ──────────────────────────────────────────
    // Si nos pasan un manager (porque somos parte de una transacción más
    // grande, ej. el cierre de tramo), reutilizamos esa transacción en vez
    // de abrir una anidada — así el snapshot, el NFT y el cambio de tramo
    // se confirman o se revierten todos juntos.

    const persist = async (m: EntityManager) => {
      // Cerrar snapshot anterior del proyecto
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
      } as unknown as ReputationIndexSnapshot);

      const saved = await m.save(ReputationIndexSnapshot, newSnapshot);

      // ── Explicaciones granulares ─────────────────────────────────────────

      const explanations: Partial<ReputationIndexExplanation>[] = [
        {
          snapshotId: saved.id,
          metricKey: 'action_score',
          sourceEntity: 'micro_action_instance',
          sourceEntityId: dto.projectId,
          contributionValue: actionScore,
          notes: `${completedInstances.length} de ${allInstances.length} microacciones completadas`,
        },
        {
          snapshotId: saved.id,
          metricKey: 'evidence_score',
          sourceEntity: 'evidence',
          sourceEntityId: dto.projectId,
          contributionValue: evidenceScore,
          notes: `${approvedEvidences.length} evidencias aprobadas, ${rejectedEvidences.length} rechazadas`,
        },
        {
          snapshotId: saved.id,
          metricKey: 'consistency_score',
          sourceEntity: 'micro_action_instance',
          sourceEntityId: dto.projectId,
          contributionValue: consistencyScore,
          notes: `${onTimeInstances.length} de ${completedInstances.length} completadas a tiempo`,
        },
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
      `IC calculado para proyecto ${dto.projectId} — IC público: ${icPublic} — algoritmo: ${algorithm.code}`,
    );

    return this.findLatestSnapshot(dto.projectId, manager);
  }

  // ─── CONSULTAS ────────────────────────────────────────────────────────────────

  async findLatestSnapshot(
    projectId: string,
    manager?: EntityManager,
  ): Promise<ReputationIndexSnapshot> {
    const repo = manager ? manager.getRepository(ReputationIndexSnapshot) : this.snapshotRepo;

    const snapshot = await repo.findOne({
      where: { projectId, validTo: IsNull() }, // ← corregido
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