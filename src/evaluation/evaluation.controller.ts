// src/evaluation/evaluation.controller.ts

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { SubmitAiResultDto } from './dto/submit-ai-result.dto';
import { SubmitHumanReviewDto } from './dto/submit-human-review.dto';
import { FinalizeEvaluationDto } from './dto/finalize-evaluation.dto';
import { CreateRubricDto } from './dto/create-rubric.dto';
import { UpdateRubricDto } from './dto/update-rubric.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('evaluations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvaluationController {
  constructor(private readonly service: EvaluationService) {}

  // ══════════════════════════════════════════════════════════════════
  // EVALUACIONES
  // ══════════════════════════════════════════════════════════════════

  // ─── POST /evaluations ────────────────────────────────────────────
  // Crea una evaluación para una evidencia en estado SUBMITTED
  // Lo dispara el sistema o un admin cuando llega una evidencia nueva
  @Post()
  @Roles(UserRole.ADMIN, UserRole.EVALUATOR)
  @HttpCode(HttpStatus.CREATED)
  createEvaluation(@Body() dto: CreateEvaluationDto) {
    return this.service.createEvaluation(dto);
  }

  // ─── POST /evaluations/ai-result ─────────────────────────────────
  // Registra el resultado del análisis de IA sobre la evidencia
  // Lo llama el sistema internamente o un servicio externo de IA
  @Post('ai-result')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  submitAiResult(@Body() dto: SubmitAiResultDto) {
    return this.service.submitAiResult(dto);
  }

  // ─── POST /evaluations/human-review ──────────────────────────────
  // El evaluador o mentor registra su revisión humana
  @Post('human-review')
  @Roles(UserRole.EVALUATOR, UserRole.MENTOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  submitHumanReview(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Body() dto: SubmitHumanReviewDto,
  ) {
    return this.service.submitHumanReview(userId, role, dto);
  }

  // ─── POST /evaluations/finalize ───────────────────────────────────
  // Consolida y cierra la evaluación con el veredicto final
  // Actualiza el estado de la evidencia (APPROVED / REJECTED / DRAFT)
  @Post('finalize')
  @Roles(UserRole.ADMIN, UserRole.EVALUATOR)
  @HttpCode(HttpStatus.OK)
  finalizeEvaluation(@Body() dto: FinalizeEvaluationDto) {
    return this.service.finalizeEvaluation(dto);
  }

  // ─── GET /evaluations/pending-reviews ────────────────────────────
  // Lista evaluaciones que requieren revisión humana y todavía no la tienen
  // Útil para el dashboard del evaluador
  @Get('pending-reviews')
  @Roles(UserRole.EVALUATOR, UserRole.MENTOR, UserRole.ADMIN)
  findPendingHumanReviews() {
    return this.service.findPendingHumanReviews();
  }

  // ─── GET /evaluations/evidence/:evidenceId ────────────────────────
  // Todas las evaluaciones de una evidencia específica
  @Get('evidence/:evidenceId')
  @Roles(
    UserRole.ENTREPRENEUR,
    UserRole.MENTOR,
    UserRole.EVALUATOR,
    UserRole.ADMIN,
  )
  findAllByEvidence(
    @Param('evidenceId', ParseUUIDPipe) evidenceId: string,
  ) {
    return this.service.findAllByEvidence(evidenceId);
  }

  // ─── GET /evaluations/:id ─────────────────────────────────────────
  // Detalle completo de una evaluación con AI result y human review
  @Get(':id')
  @Roles(
    UserRole.ENTREPRENEUR,
    UserRole.MENTOR,
    UserRole.EVALUATOR,
    UserRole.ADMIN,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneEvaluation(id);
  }

  // ══════════════════════════════════════════════════════════════════
  // RÚBRICAS
  // ══════════════════════════════════════════════════════════════════

  // ─── POST /evaluations/rubrics ────────────────────────────────────
  // Crea una rúbrica nueva (solo admin)
  @Post('rubrics')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  createRubric(@Body() dto: CreateRubricDto) {
    return this.service.createRubric(dto);
  }

  // ─── GET /evaluations/rubrics ─────────────────────────────────────
  // Lista todas las rúbricas activas
  @Get('rubrics')
  @Roles(
    UserRole.ADMIN,
    UserRole.EVALUATOR,
    UserRole.MENTOR,
  )
  findAllRubrics() {
    return this.service.findAllRubrics();
  }

  // ─── GET /evaluations/rubrics/:id ────────────────────────────────
  @Get('rubrics/:id')
  @Roles(
    UserRole.ADMIN,
    UserRole.EVALUATOR,
    UserRole.MENTOR,
  )
  findOneRubric(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneRubric(id);
  }

  // ─── PATCH /evaluations/rubrics/:id ──────────────────────────────
  // Actualiza una rúbrica (solo admin)
  @Patch('rubrics/:id')
  @Roles(UserRole.ADMIN)
  updateRubric(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRubricDto,
  ) {
    return this.service.updateRubric(id, dto);
  }
}