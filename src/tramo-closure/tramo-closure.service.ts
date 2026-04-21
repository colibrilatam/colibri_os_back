// src/tramo-closure/tramo-closure.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import { EvaluateClosureDto } from './dto/evaluate-closure.dto';
import { CloseTramoDto } from './dto/close-tramo.dto';

// Cantidad de evidencias aprobadas requeridas para cerrar un tramo
const REQUIRED_APPROVED_EVIDENCES = 7;

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

    private readonly reputationService: ReputationService,
    private readonly nftProjectService: NftProjectService,
    private readonly tramosService: TramosService,
  ) {}

  // ─── VERIFICACIÓN DE COMPLETITUD ──────────────────────────────────────────────
  // Traversal: evidence → microActionInstance → microActionDefinition → pac → category → tramo

  async evaluateCompletion(
    dto: EvaluateClosureDto,
  ): Promise<TramoCompletionStatus> {
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

    const approvedCount = await this.countApprovedEvidencesForTramo(
      dto.projectId,
      dto.tramoId,
    );

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

  // ─── CIERRE DE TRAMO ──────────────────────────────────────────────────────────
  // Dispara los tres efectos estructurales definidos en la documentación:
  // 1. Actualización consolidada del Índice Colibrí
  // 2. Evolución visual del NFT Colibrí
  // 3. Habilitación del acceso al siguiente tramo

  async closeTramo(dto: CloseTramoDto): Promise<{
    message: string;
    projectId: string;
    closedTramoId: string;
    nextTramoId: string | null;
    icPublic: number;
    nftEvolved: boolean;
  }> {
    // ── Validaciones previas ─────────────────────────────────────────────────

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
      throw new BadRequestException(
        `El tramo ${dto.tramoId} no es el tramo actual del proyecto`,
      );
    }

    const currentTramo = await this.tramoRepo.findOne({
      where: { id: dto.tramoId },
    });

    if (!currentTramo) {
      throw new NotFoundException(`Tramo ${dto.tramoId} no encontrado`);
    }

    // ── Buscar el siguiente tramo ────────────────────────────────────────────

    const nextTramo = await this.tramoRepo.findOne({
      where: { sortOrder: currentTramo.sortOrder + 1, isActive: true },
    });

    // ── Efecto 1: Recalcular IC consolidado ──────────────────────────────────

    const snapshot = await this.reputationService.calculateSnapshot({
      projectId: dto.projectId,
    });

    this.logger.log(
      `[Cierre T${currentTramo.code}] IC recalculado — proyecto: ${dto.projectId} — IC público: ${snapshot.icPublic}`,
    );

    // ── Efecto 2: Evolución visual del NFT ───────────────────────────────────

    let nftEvolved = false;
    const newVisualVersion = dto.newVisualVersion ?? `v${currentTramo.sortOrder + 1}`;

    try {
      const nftStatus = await this.nftProjectService.checkNftStatus(
        dto.projectId,
      );

      if (nftStatus.hasNft) {
        await this.nftProjectService.evolveVisual(
          dto.projectId,
          nextTramo?.id ?? dto.tramoId,
          newVisualVersion,
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
    } catch {
      // La evolución del NFT no debe bloquear el cierre del tramo
      this.logger.warn(
        `[Cierre T${currentTramo.code}] No se pudo evolucionar el NFT — continuando`,
      );
    }

    // ── Efecto 3: Habilitar el siguiente tramo ───────────────────────────────

    let nextTramoId: string | null = null;

    if (nextTramo) {
      await this.tramosService.changeTramo(
        dto.projectId,
        { newTramoId: nextTramo.id, changeReason: `Cierre de ${currentTramo.code}` },
      );
      nextTramoId = nextTramo.id;

      this.logger.log(
        `[Cierre T${currentTramo.code}] Proyecto avanzó a ${nextTramo.code}`,
      );
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
    };
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