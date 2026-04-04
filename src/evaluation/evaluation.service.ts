// src/evaluation/evaluation.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Evaluation } from './entities/evaluation.entity';
import { EvaluationAiResult } from './entities/evaluation-ai-result.entity';
import { EvaluationHumanReview } from './entities/evaluation-human-review.entity';
import { Rubric } from './entities/rubric.entity';
import {
  EvaluationType,
  EvaluationResult,
} from './entities/evaluation.enums';
import { Evidence, EvidenceStatus, ValidationStatus } from '../evidence/entities/evidence.entity';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { SubmitAiResultDto } from './dto/submit-ai-result.dto';
import { SubmitHumanReviewDto } from './dto/submit-human-review.dto';
import { FinalizeEvaluationDto } from './dto/finalize-evaluation.dto';
import { CreateRubricDto } from './dto/create-rubric.dto';
import { UpdateRubricDto } from './dto/update-rubric.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);

  constructor(
    @InjectRepository(Evaluation)
    private readonly evaluationRepo: Repository<Evaluation>,

    @InjectRepository(EvaluationAiResult)
    private readonly aiResultRepo: Repository<EvaluationAiResult>,

    @InjectRepository(EvaluationHumanReview)
    private readonly humanReviewRepo: Repository<EvaluationHumanReview>,

    @InjectRepository(Rubric)
    private readonly rubricRepo: Repository<Rubric>,

    @InjectRepository(Evidence)
    private readonly evidenceRepo: Repository<Evidence>,

    private readonly dataSource: DataSource,
  ) {}

  // ─── EVALUACIONES ─────────────────────────────────────────────────────────────

  // Crea una evaluación para una evidencia (la dispara el sistema o un admin)
  async createEvaluation(dto: CreateEvaluationDto): Promise<Evaluation> {
    // FIX: se usaba 'evaluation' antes de declararlo — corregido a 'dto'
    const evidence = await this.evidenceRepo.findOne({
      where: { id: dto.evidenceId },
    });

    if (!evidence) {
      throw new NotFoundException(
        `Evidence ${dto.evidenceId} no encontrada`,
      );
    }

    if (evidence.status !== EvidenceStatus.SUBMITTED) {
      throw new BadRequestException(
        `Solo se puede evaluar una evidencia en estado SUBMITTED. Estado actual: "${evidence.status}"`,
      );
    }

    // Verificamos que la rúbrica exista y esté activa
    const rubric = await this.rubricRepo.findOne({
      where: { id: dto.rubricId, isActive: true },
    });

    if (!rubric) {
      throw new NotFoundException(
        `Rúbrica ${dto.rubricId} no encontrada o inactiva`,
      );
    }

    // Verificamos que no haya una evaluación activa para esta evidencia
    const existingEval = await this.evaluationRepo.findOne({
      where: { evidenceId: dto.evidenceId, isFinal: false },
    });

    if (existingEval) {
      throw new BadRequestException(
        `Ya existe una evaluación en curso para la evidencia ${dto.evidenceId}`,
      );
    }

    const evaluation = this.evaluationRepo.create({
      evidenceId: dto.evidenceId,
      rubricId: dto.rubricId,
      rubricVersion: dto.rubricVersion,
      evaluationType: dto.evaluationType ?? EvaluationType.HYBRID,
      evaluationSourceWeight: dto.evaluationSourceWeight ?? 0.5,
      isFinal: false,
    });

    // Pasamos la evidencia a UNDER_REVIEW
    evidence.status = EvidenceStatus.UNDER_REVIEW;
    evidence.validationStatus = ValidationStatus.AI_REVIEWED;

    await this.dataSource.transaction(async (manager) => {
      await manager.save(Evidence, evidence);
      await manager.save(Evaluation, evaluation);
    });

    this.logger.log(
      `Evaluación creada para evidence ${dto.evidenceId} con rúbrica ${dto.rubricId}`,
    );

    return this.findOneEvaluation(evaluation.id);
  }

  // Registra el resultado del análisis de IA sobre la evidencia
  async submitAiResult(dto: SubmitAiResultDto): Promise<EvaluationAiResult> {
    const evaluation = await this.findOneEvaluation(dto.evaluationId);

    if (evaluation.isFinal) {
      throw new BadRequestException(
        'No se puede modificar una evaluación finalizada',
      );
    }

    // Si ya existe un resultado de IA, lo actualizamos
    const existing = await this.aiResultRepo.findOne({
      where: { evaluationId: dto.evaluationId },
    });

    if (existing) {
      Object.assign(existing, {
        aiModelUsed: dto.aiModelUsed,
        aiModelVersion: dto.aiModelVersion ?? null,
        aiResult: dto.aiResult,
        aiScore: dto.aiScore ?? null,
        aiDimensionScoresJson: dto.aiDimensionScoresJson ?? null,
        aiConfidence: dto.aiConfidence ?? null,
        aiReasoning: dto.aiReasoning ?? null,
        rawResponseJson: dto.rawResponseJson ?? null,
        processedAt: new Date(),
      });

      return this.aiResultRepo.save(existing);
    }

    // FIX: cast explícito para evitar ambigüedad de overload en repo.create()
    const aiResult = this.aiResultRepo.create({
      evaluationId: dto.evaluationId,
      rubricId: evaluation.rubricId,
      rubricVersion: evaluation.rubricVersion,
      aiModelUsed: dto.aiModelUsed,
      aiModelVersion: dto.aiModelVersion ?? null,
      aiResult: dto.aiResult,
      aiScore: dto.aiScore ?? null,
      aiDimensionScoresJson: dto.aiDimensionScoresJson ?? null,
      aiConfidence: dto.aiConfidence ?? null,
      aiReasoning: dto.aiReasoning ?? null,
      rawResponseJson: dto.rawResponseJson ?? null,
      processedAt: new Date(),
    } as EvaluationAiResult);

    const saved = await this.aiResultRepo.save(aiResult);

    // Si la evaluación es automática la finalizamos directo
    if (evaluation.evaluationType === EvaluationType.AUTOMATIC) {
      await this.autoFinalize(evaluation, dto.aiResult, dto.aiScore);
    }

    this.logger.log(
      `AI result registrado para evaluation ${dto.evaluationId} — resultado: ${dto.aiResult}`,
    );

    return saved;
  }

  // Registra la revisión humana del evaluador o mentor
  async submitHumanReview(
    reviewerUserId: string,
    reviewerRole: UserRole,
    dto: SubmitHumanReviewDto,
  ): Promise<EvaluationHumanReview> {
    this.assertReviewerRole(reviewerRole);

    const evaluation = await this.findOneEvaluation(dto.evaluationId);

    if (evaluation.isFinal) {
      throw new BadRequestException(
        'No se puede modificar una evaluación finalizada',
      );
    }

    // Si ya existe una review humana, la actualizamos
    const existing = await this.humanReviewRepo.findOne({
      where: { evaluationId: dto.evaluationId },
    });

    if (existing) {
      Object.assign(existing, {
        reviewerUserId,
        reviewDecision: dto.reviewDecision,
        humanScore: dto.humanScore ?? null,
        humanDimensionScoresJson: dto.humanDimensionScoresJson ?? null,
        agreesWithAi: dto.agreesWithAi ?? null,
        overrideReason: dto.overrideReason ?? null,
        comment: dto.comment ?? null,
        reviewedAt: new Date(),
      });

      return this.humanReviewRepo.save(existing);
    }

    // FIX: cast explícito para evitar ambigüedad de overload en repo.create()
    const humanReview = this.humanReviewRepo.create({
      evaluationId: dto.evaluationId,
      reviewerUserId,
      reviewDecision: dto.reviewDecision,
      humanScore: dto.humanScore ?? null,
      humanDimensionScoresJson: dto.humanDimensionScoresJson ?? null,
      agreesWithAi: dto.agreesWithAi ?? null,
      overrideReason: dto.overrideReason ?? null,
      comment: dto.comment ?? null,
      reviewedAt: new Date(),
    } as EvaluationHumanReview);

    const saved = await this.humanReviewRepo.save(humanReview);

    this.logger.log(
      `Human review registrada para evaluation ${dto.evaluationId} por usuario ${reviewerUserId}`,
    );

    return saved;
  }

  // Consolida y cierra la evaluación con el veredicto final
  async finalizeEvaluation(dto: FinalizeEvaluationDto): Promise<Evaluation> {
    const evaluation = await this.findOneEvaluation(dto.evaluationId);

    if (evaluation.isFinal) {
      throw new BadRequestException('La evaluación ya está finalizada');
    }

    const evidence = await this.evidenceRepo.findOne({
      where: { id: evaluation.evidenceId },
    });

    // FIX: guard para que TypeScript sepa que evidence no es null de aquí en adelante
    if (!evidence) {
      throw new NotFoundException(
        `Evidence ${evaluation.evidenceId} no encontrada`,
      );
    }

    // Mapeamos resultado → estado de evidencia y validación
    const { evidenceStatus, validationStatus } = this.mapResultToStatuses(
      dto.evaluationResult,
    );

    const now = new Date();

    await this.dataSource.transaction(async (manager) => {
      // Finalizamos la evaluación
      // FIX: campos nullable deben declararse como | null en la entidad Evaluation
      evaluation.evaluationResult = dto.evaluationResult;
      evaluation.score = dto.score ?? null;
      evaluation.dimensionScoresJson = dto.dimensionScoresJson ?? null;
      evaluation.comment = dto.comment ?? null;
      evaluation.isFinal = true;
      evaluation.evaluatedAt = now;
      await manager.save(Evaluation, evaluation);

      // Actualizamos la evidencia
      evidence.status = evidenceStatus;
      evidence.validationStatus = validationStatus;
      evidence.validatedByUserId = null; // se setea desde human review si aplica

      if (evidenceStatus === EvidenceStatus.APPROVED) {
        evidence.approvedAt = now;
        evidence.isValidForIc = true;
      } else if (evidenceStatus === EvidenceStatus.REJECTED) {
        evidence.rejectedAt = now;
      }

      await manager.save(Evidence, evidence);
    });

    this.logger.log(
      `Evaluation ${dto.evaluationId} finalizada — resultado: ${dto.evaluationResult}`,
    );

    return this.findOneEvaluation(evaluation.id);
  }

  // ─── CONSULTAS DE EVALUACIONES ────────────────────────────────────────────────

  async findOneEvaluation(id: string): Promise<Evaluation> {
    const evaluation = await this.evaluationRepo.findOne({
      where: { id },
      relations: ['evidence', 'rubric', 'aiResult', 'humanReview'],
    });

    if (!evaluation) {
      throw new NotFoundException(`Evaluation ${id} no encontrada`);
    }

    return evaluation;
  }

  async findAllByEvidence(evidenceId: string): Promise<Evaluation[]> {
    return this.evaluationRepo.find({
      where: { evidenceId },
      relations: ['rubric', 'aiResult', 'humanReview'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPendingHumanReviews(): Promise<Evaluation[]> {
    return this.evaluationRepo
      .createQueryBuilder('evaluation')
      .leftJoinAndSelect('evaluation.evidence', 'evidence')
      .leftJoinAndSelect('evaluation.rubric', 'rubric')
      .leftJoinAndSelect('evaluation.aiResult', 'aiResult')
      .leftJoinAndSelect('evaluation.humanReview', 'humanReview')
      .where('evaluation.is_final = false')
      .andWhere('evaluation.evaluation_type IN (:...types)', {
        types: [EvaluationType.HUMAN, EvaluationType.HYBRID],
      })
      .andWhere('humanReview.id IS NULL')
      .orderBy('evaluation.created_at', 'ASC')
      .getMany();
  }

  // ─── RÚBRICAS ─────────────────────────────────────────────────────────────────

  async createRubric(dto: CreateRubricDto): Promise<Rubric> {
    const existing = await this.rubricRepo.findOne({
      where: { code: dto.code },
    });

    if (existing) {
      throw new BadRequestException(
        `Ya existe una rúbrica con el código "${dto.code}"`,
      );
    }

    // FIX: cast explícito para evitar ambigüedad de overload en repo.create()
    const rubric = this.rubricRepo.create({
      ...dto,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
      validTo: dto.validTo ? new Date(dto.validTo) : null,
      isActive: dto.isActive ?? true,
    } as Rubric);

    return this.rubricRepo.save(rubric);
  }

  async findAllRubrics(): Promise<Rubric[]> {
    return this.rubricRepo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneRubric(id: string): Promise<Rubric> {
    const rubric = await this.rubricRepo.findOne({ where: { id } });

    if (!rubric) {
      throw new NotFoundException(`Rúbrica ${id} no encontrada`);
    }

    return rubric;
  }

  async updateRubric(id: string, dto: UpdateRubricDto): Promise<Rubric> {
    const rubric = await this.findOneRubric(id);

    Object.assign(rubric, {
      ...dto,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : rubric.validFrom,
      validTo: dto.validTo ? new Date(dto.validTo) : rubric.validTo,
    });

    return this.rubricRepo.save(rubric);
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────────

  private assertReviewerRole(role: UserRole): void {
    const allowedRoles: UserRole[] = [
      UserRole.EVALUATOR,
      UserRole.MENTOR,
      UserRole.ADMIN,
    ];

    if (!allowedRoles.includes(role)) {
      throw new ForbiddenException(
        'Solo evaluadores, mentores o admins pueden registrar una revisión humana',
      );
    }
  }

  private mapResultToStatuses(result: EvaluationResult): {
    evidenceStatus: EvidenceStatus;
    validationStatus: ValidationStatus;
  } {
    switch (result) {
      case EvaluationResult.APPROVED:
        return {
          evidenceStatus: EvidenceStatus.APPROVED,
          validationStatus: ValidationStatus.VALIDATED,
        };
      case EvaluationResult.REJECTED:
        return {
          evidenceStatus: EvidenceStatus.REJECTED,
          validationStatus: ValidationStatus.REJECTED,
        };
      case EvaluationResult.NEEDS_REVISION:
        return {
          evidenceStatus: EvidenceStatus.DRAFT,
          validationStatus: ValidationStatus.HUMAN_REVIEWED,
        };
    }
  }

  // Finalización automática para evaluaciones 100% automáticas
  private async autoFinalize(
    evaluation: Evaluation,
    aiResult: EvaluationResult,
    aiScore?: number,
  ): Promise<void> {
    await this.finalizeEvaluation({
      evaluationId: evaluation.id,
      evaluationResult: aiResult,
      score: aiScore,
      comment: 'Finalización automática por resultado de IA',
    });
  }
}