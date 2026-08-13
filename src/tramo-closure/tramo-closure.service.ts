// src/tramo-closure/tramo-closure.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Evidence, EvidenceStatus } from '../evidence/entities/evidence.entity';
import { MicroActionInstance } from '../micro-action-instance/entities/micro-action-instance.entity';
import { MicroActionDefinition } from '../micro-action-definitions/entities/micro-action-definition.entity';
import { Pac } from '../pacs/entities/pac.entity';
import { Category } from '../categories/entities/category.entity';
import { Tramo } from '../tramos/entities/tramo.entity';
import { Project } from '../projects/entities/project.entity';
import { ReputationService } from '../reputation/reputation.service';
import { NftProjectService } from '../nfts/nft-project/nfts-project.service';
import { TramosService } from '../tramos/tramos.service';
import {
  TramoClosureOperation,
  TramoClosureStatus,
} from './entities/tramo-closure-operation.entity';
import { EvaluateClosureDto } from './dto/evaluate-closure.dto';
import { CloseTramoDto } from './dto/close-tramo.dto';

// Cantidad de evidencias aprobadas requeridas para cerrar un tramo
const REQUIRED_APPROVED_EVIDENCES = 7;

// Reintentos automáticos máximos que hace el cron de reconciliación antes
// de dejar la operación en FAILED para revisión manual.
const MAX_RECONCILE_ATTEMPTS = 5;

export interface TramoCompletionStatus {
  projectId: string;
  tramoId: string;
  tramoCode: string;
  approvedEvidences: number;
  requiredEvidences: number;
  isComplete: boolean;
  missingEvidences: number;
  canClose: boolean;
}

export interface CloseTramoResult {
  message: string;
  projectId: string;
  closedTramoId: string;
  nextTramoId: string | null;
  icPublic: number;
  nftEvolved: boolean;
  idempotencyKey: string;
  replayed: boolean;
}

export interface ReconciliationIssue {
  projectId: string;
  description: string;
}

@Injectable()
export class TramoClosureService {
  private readonly logger = new Logger(TramoClosureService.name);

  constructor(
    @InjectRepository(Evidence)
    private readonly evidenceRepo: Repository<Evidence>,

    @InjectRepository(MicroActionInstance)
    private readonly instanceRepo: Repository<MicroActionInstance>,

    @InjectRepository(MicroActionDefinition)
    private readonly madRepo: Repository<MicroActionDefinition>,

    @InjectRepository(Pac)
    private readonly pacRepo: Repository<Pac>,

    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,

    @InjectRepository(Tramo)
    private readonly tramoRepo: Repository<Tramo>,

    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    @InjectRepository(TramoClosureOperation)
    private readonly operationRepo: Repository<TramoClosureOperation>,

    private readonly reputationService: ReputationService,
    private readonly nftProjectService: NftProjectService,
    private readonly tramosService: TramosService,
    private readonly dataSource: DataSource,
  ) {}

  // ─── VERIFICACIÓN DE COMPLETITUD ──────────────────────────────────────────────
  // Traversal: evidence → microActionInstance → microActionDefinition → pac → category → tramo

  async evaluateCompletion(dto: EvaluateClosureDto): Promise<TramoCompletionStatus> {
    const tramo = await this.tramoRepo.findOne({
      where: { id: dto.tramoId },
    });

    if (!tramo) {
      throw new NotFoundException(`Tramo ${dto.tramoId} no encontrado`);
    }

    const project = await this.projectRepo.findOne({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException(`Proyecto ${dto.projectId} no encontrado`);
    }

    const approvedCount = await this.countApprovedEvidencesForTramo(dto.projectId, dto.tramoId);

    const isComplete = approvedCount >= REQUIRED_APPROVED_EVIDENCES;

    return {
      projectId: dto.projectId,
      tramoId: dto.tramoId,
      tramoCode: tramo.code,
      approvedEvidences: approvedCount,
      requiredEvidences: REQUIRED_APPROVED_EVIDENCES,
      isComplete,
      missingEvidences: Math.max(0, REQUIRED_APPROVED_EVIDENCES - approvedCount),
      canClose: isComplete && project.currentTramoId === dto.tramoId,
    };
  }

  // ─── CIERRE DE TRAMO (TX-001) ──────────────────────────────────────────────────
  // Dispara, de forma atómica e idempotente, los tres efectos estructurales:
  // 1. Actualización consolidada del Índice Colibrí (snapshot)
  // 2. Evolución visual del NFT Colibrí
  // 3. Habilitación del acceso al siguiente tramo
  //
  // Estrategia: transacción única de base de datos + tabla de idempotencia.
  // Hoy los tres efectos son escrituras en el mismo Postgres (el NFT es
  // simulado, no hay llamada a blockchain todavía), así que una transacción
  // ACID nos da atomicidad real "gratis": o se aplican los tres efectos, o
  // no se aplica ninguno. No pueden quedar estados parciales silenciosos.
  //
  // La tabla `tramo_closure_operations` cubre lo que la transacción sola no
  // puede resolver:
  //   - Idempotencia real ante reintentos del cliente (misma idempotencyKey
  //     nunca vuelve a ejecutar los efectos; devuelve el resultado guardado).
  //   - Estado recuperable ante caída del proceso a mitad de la transacción
  //     (la fila queda IN_PROGRESS/FAILED y el cron de reconciliación la
  //     puede reintentar o alertar).
  //   - Auditoría/reconciliación: comparar snapshot, NFT y tramo actual.
  //
  // Si en el futuro la evolución del NFT pasa a ser una llamada real a
  // blockchain (hoy `contractAddress` es 'PENDING_BLOCKCHAIN'), este método
  // deja de poder envolver todo en una sola transacción de Postgres. En ese
  // momento, `tramo_closure_operations` ya está lista para evolucionar a un
  // outbox real: publicar un evento "nft.evolve" dentro de la misma
  // transacción, y que un worker aparte lo consuma con reintentos +
  // compensación (revertir el cambio de tramo si la evolución del NFT
  // termina fallando de forma definitiva).

  async closeTramo(dto: CloseTramoDto): Promise<CloseTramoResult> {
    const idempotencyKey = dto.idempotencyKey?.trim() || `${dto.projectId}:${dto.tramoId}`;

    // ── Camino rápido: ¿ya se ejecutó esta operación? ────────────────────────
    const existing = await this.operationRepo.findOne({ where: { idempotencyKey } });

  if (existing?.status === TramoClosureStatus.COMPLETED) {
        return { ...(existing.resultPayload as unknown as CloseTramoResult), replayed: true };
      }

    if (existing?.status === TramoClosureStatus.IN_PROGRESS) {
      throw new ConflictException(
        `Ya hay un cierre en curso para esta operación (idempotencyKey: ${idempotencyKey})`,
      );
    }

    // ── Validaciones previas (lectura, se pueden repetir sin riesgo) ─────────

    const status = await this.evaluateCompletion({
      projectId: dto.projectId,
      tramoId: dto.tramoId,
    });

    if (!status.isComplete) {
      throw new BadRequestException(
        `El tramo no puede cerrarse: faltan ${status.missingEvidences} evidencias aprobadas (${status.approvedEvidences}/${REQUIRED_APPROVED_EVIDENCES})`,
      );
    }

    if (!status.canClose) {
      throw new BadRequestException(`El tramo ${dto.tramoId} no es el tramo actual del proyecto`);
    }

    const currentTramo = await this.tramoRepo.findOne({
      where: { id: dto.tramoId },
    });

    if (!currentTramo) {
      throw new NotFoundException(`Tramo ${dto.tramoId} no encontrado`);
    }

    const nextTramo = await this.tramoRepo.findOne({
      where: { sortOrder: currentTramo.sortOrder + 1, isActive: true },
    });

    const newVisualVersion = dto.newVisualVersion ?? `v${currentTramo.sortOrder + 1}`;

    // ── Reclamar la operación de forma atómica (INSERT ... ON CONFLICT) ─────
    // Esto es lo que hace que dos requests simultáneos con la misma
    // idempotencyKey no puedan ejecutar los efectos dos veces.

    const operation = await this.claimOperation(idempotencyKey, dto);

    if (operation.status === TramoClosureStatus.COMPLETED) {
          // Alguien más terminó la operación justo mientras validábamos.
          return { ...(operation.resultPayload as unknown as CloseTramoResult), replayed: true };
        }

    try {
      const result = await this.executeClosureTransaction({
        dto,
        currentTramo,
        nextTramo,
        newVisualVersion,
        idempotencyKey,
      });

    await this.operationRepo.update(operation.id, {
            status: TramoClosureStatus.COMPLETED,
            resultPayload: JSON.parse(JSON.stringify(result)),
            completedAt: new Date(),
            lastError: null,
          });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';

      // La transacción ya hizo rollback: no hay estados parciales en las
      // tablas de negocio. Solo dejamos constancia recuperable del fallo.
      await this.operationRepo.update(operation.id, {
        status: TramoClosureStatus.FAILED,
        lastError: message,
        attempts: operation.attempts + 1,
      });

      this.logger.error(
        `[Cierre T${currentTramo.code}] Falló y se revirtió — proyecto: ${dto.projectId} — ${message}`,
      );

      throw err;
    }
  }

  // Efectos estructurales del cierre, todos dentro de una única transacción.
  private async executeClosureTransaction(params: {
    dto: CloseTramoDto;
    currentTramo: Tramo;
    nextTramo: Tramo | null;
    newVisualVersion: string;
    idempotencyKey: string;
  }): Promise<CloseTramoResult> {
    const { dto, currentTramo, nextTramo, newVisualVersion, idempotencyKey } = params;

    return this.dataSource.transaction(async (manager: EntityManager) => {
      // ── Efecto 1: Recalcular IC consolidado ────────────────────────────
      const snapshot = await this.reputationService.calculateSnapshot(
        { projectId: dto.projectId },
        manager,
      );

      this.logger.log(
        `[Cierre T${currentTramo.code}] IC recalculado — proyecto: ${dto.projectId} — IC público: ${snapshot.icPublic}`,
      );

      // ── Efecto 2: Evolución visual del NFT ─────────────────────────────
      let nftEvolved = false;

      const nftStatus = await this.nftProjectService.checkNftStatus(dto.projectId, manager);

      if (nftStatus.hasNft) {
        await this.nftProjectService.evolveVisual(
          dto.projectId,
          nextTramo?.id ?? dto.tramoId,
          newVisualVersion,
          manager,
        );
        nftEvolved = true;

        this.logger.log(
          `[Cierre T${currentTramo.code}] NFT evolucionado a ${newVisualVersion} — proyecto: ${dto.projectId}`,
        );
      } else {
        this.logger.log(
          `[Cierre T${currentTramo.code}] Proyecto sin NFT — se omite evolución visual`,
        );
      }

      // ── Efecto 3: Habilitar el siguiente tramo ─────────────────────────
      let nextTramoId: string | null = null;

      if (nextTramo) {
        await this.tramosService.changeTramo(
          dto.projectId,
          {
            newTramoId: nextTramo.id,
            changeReason: `Cierre de ${currentTramo.code}`,
          },
          undefined,
          manager,
        );
        nextTramoId = nextTramo.id;

        this.logger.log(`[Cierre T${currentTramo.code}] Proyecto avanzó a ${nextTramo.code}`);
      } else {
        this.logger.log(
          `[Cierre T${currentTramo.code}] No hay tramo siguiente — fin de la ruta de vuelo`,
        );
      }

      return {
        message: nextTramo
          ? `Tramo ${currentTramo.code} cerrado exitosamente. El proyecto avanzó a ${nextTramo.code}.`
          : `Tramo ${currentTramo.code} cerrado exitosamente. El proyecto completó la ruta de vuelo.`,
        projectId: dto.projectId,
        closedTramoId: dto.tramoId,
        nextTramoId,
        icPublic: Number(snapshot.icPublic),
        nftEvolved,
        idempotencyKey,
        replayed: false,
      };
    });
  }

  // Inserta (o recupera) la fila de idempotencia de forma atómica.
  // `ON CONFLICT DO NOTHING` + re-lectura evita condiciones de carrera entre
  // requests concurrentes con la misma idempotencyKey.
  private async claimOperation(
    idempotencyKey: string,
    dto: CloseTramoDto,
  ): Promise<TramoClosureOperation> {
    await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(TramoClosureOperation)
      .values({
        idempotencyKey,
        projectId: dto.projectId,
        tramoId: dto.tramoId,
        status: TramoClosureStatus.IN_PROGRESS,
      })
      .orIgnore()
      .execute();

    const operation = await this.operationRepo.findOne({ where: { idempotencyKey } });

    if (!operation) {
      // No debería pasar nunca, pero si pasa preferimos fallar explícito
      // antes que ejecutar los efectos sin registro de idempotencia.
      throw new ConflictException('No se pudo registrar la operación de cierre de tramo');
    }

    // Si la fila ya existía en FAILED (reintento tras un fallo previo), la
    // reactivamos para este intento.
    if (operation.status === TramoClosureStatus.FAILED) {
      await this.operationRepo.update(operation.id, { status: TramoClosureStatus.IN_PROGRESS });
      operation.status = TramoClosureStatus.IN_PROGRESS;
    }

    return operation;
  }

  // ─── RECONCILIACIÓN ─────────────────────────────────────────────────────────
  // Detecta desincronizaciones entre proyecto, NFT y snapshot que pudieran
  // haber quedado de código legado o de fallos no cubiertos por la
  // transacción (ej. datos tocados fuera de este servicio). Corre cada hora
  // y también se puede invocar manualmente desde el controller.

  @Cron(CronExpression.EVERY_HOUR)
  async reconcileAll(): Promise<ReconciliationIssue[]> {
    const issues = await this.findInconsistentProjects();

    if (issues.length > 0) {
      this.logger.warn(
        `Reconciliación de cierre de tramo: ${issues.length} proyecto(s) con posible desincronización`,
      );
    }

    // También reintentamos operaciones que quedaron en FAILED por caídas
    // transitorias, hasta un máximo de intentos.
    const failedOps = await this.operationRepo.find({
      where: { status: TramoClosureStatus.FAILED },
      take: 25,
    });

    for (const op of failedOps) {
      if (op.attempts >= MAX_RECONCILE_ATTEMPTS) continue;

      await this.closeTramo({
        projectId: op.projectId,
        tramoId: op.tramoId,
        idempotencyKey: op.idempotencyKey,
      }).catch((err: unknown) =>
        this.logger.warn(
          `Reconciliación: reintento automático de ${op.idempotencyKey} falló: ${
            err instanceof Error ? err.message : 'Error desconocido'
          }`,
        ),
      );
    }

    return issues;
  }

  async findInconsistentProjects(): Promise<ReconciliationIssue[]> {
    const issues: ReconciliationIssue[] = [];

    const projects = await this.projectRepo.find();

    for (const project of projects) {
      if (!project.currentTramoId) continue;

      const { hasNft, nftProject } = await this.nftProjectService.checkNftStatus(project.id);

      if (hasNft && nftProject && nftProject.representedTramoId !== project.currentTramoId) {
        issues.push({
          projectId: project.id,
          description: `El NFT representa el tramo ${nftProject.representedTramoId} pero el proyecto está en ${project.currentTramoId}`,
        });
      }
    }

    return issues;
  }

  // ─── HELPER PRIVADO ───────────────────────────────────────────────────────────
  // Traversal completo para contar evidencias aprobadas en un tramo

  private async countApprovedEvidencesForTramo(
    projectId: string,
    tramoId: string,
  ): Promise<number> {
    // 1. Categorías del tramo
    const categories = await this.categoryRepo.find({
      where: { tramoId },
      select: ['id'],
    });

    if (categories.length === 0) return 0;

    const categoryIds = categories.map((c) => c.id);

    // 2. PACs de esas categorías
    const pacs = await this.pacRepo
      .createQueryBuilder('pac')
      .where('pac.category_id IN (:...categoryIds)', { categoryIds })
      .select(['pac.id'])
      .getMany();

    if (pacs.length === 0) return 0;

    const pacIds = pacs.map((p) => p.id);

    // 3. MicroActionDefinitions de esos PACs que requieren evidencia
    const definitions = await this.madRepo
      .createQueryBuilder('mad')
      .where('mad.pac_id IN (:...pacIds)', { pacIds })
      .andWhere('mad.evidence_required = true')
      .select(['mad.id'])
      .getMany();

    if (definitions.length === 0) return 0;

    const definitionIds = definitions.map((d) => d.id);

    // 4. Instancias del proyecto para esas definiciones
    const instances = await this.instanceRepo
      .createQueryBuilder('mai')
      .where('mai.project_id = :projectId', { projectId })
      .andWhere('mai.micro_action_definition_id IN (:...definitionIds)', {
        definitionIds,
      })
      .select(['mai.id'])
      .getMany();

    if (instances.length === 0) return 0;

    const instanceIds = instances.map((i) => i.id);

    // 5. Evidencias aprobadas para esas instancias
    const approvedCount = await this.evidenceRepo
      .createQueryBuilder('ev')
      .where('ev.micro_action_instance_id IN (:...instanceIds)', {
        instanceIds,
      })
      .andWhere('ev.status = :status', { status: EvidenceStatus.APPROVED })
      .andWhere('ev.is_valid_for_ic = true')
      .getCount();

    return approvedCount;
  }
}