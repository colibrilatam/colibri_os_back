import {
  Controller, Get, Post, Patch, Param, Body,
  UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiParam,
  ApiBearerAuth, ApiBody,
} from '@nestjs/swagger';
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

const EXAMPLE_EVALUATION = {
  id: 'eval-uuid-0001',
  evidenceId: 'ev-uuid-0001',
  rubricId: 'rubric-uuid-0001',
  rubricVersion: 'v1.0',
  evaluationType: 'hybrid',
  evaluationResult: null,
  score: null,
  isFinal: false,
  evaluationSourceWeight: '0.50',
  comment: null,
  evaluatedAt: null,
  createdAt: '2024-04-05T09:00:00.000Z',
  updatedAt: '2024-04-05T09:00:00.000Z',
};

const EXAMPLE_RUBRIC = {
  id: 'rubric-uuid-0001',
  code: 'RUB-ENTREVISTAS-V1',
  name: 'Rúbrica de entrevistas de descubrimiento',
  targetEntity: 'evidence',
  version: 'v1.0',
  isActive: true,
  criteriaJson: { dimensions: [{ name: 'consistency', weight: 0.33 }] },
  createdAt: '2024-01-01T00:00:00.000Z',
};

@ApiTags('Evaluations')
@ApiBearerAuth()
@Controller('evaluations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvaluationController {
  constructor(private readonly service: EvaluationService) {}

  // ══════════════════════════════════════════════════════════
  // EVALUACIONES
  // ══════════════════════════════════════════════════════════

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EVALUATOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una evaluación',
    description: 'Crea una evaluación para una evidencia en estado `submitted`. Mueve la evidencia a `under_review`. Solo puede haber una evaluación activa por evidencia.',
  })
  @ApiBody({ type: CreateEvaluationDto })
  @ApiResponse({ status: 201, description: 'Evaluación creada.', schema: { example: EXAMPLE_EVALUATION } })
  @ApiResponse({ status: 400, description: 'La evidencia no está en `submitted` o ya tiene una evaluación activa.' })
  @ApiResponse({ status: 404, description: 'Evidencia o rúbrica no encontrada.' })
  createEvaluation(@Body() dto: CreateEvaluationDto) {
    return this.service.createEvaluation(dto);
  }

  @Post('ai-result')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar resultado de IA',
    description: 'El servicio de IA registra su análisis sobre la evidencia. Si el `evaluationType` es `automatic`, la evaluación se finaliza automáticamente.',
  })
  @ApiBody({ type: SubmitAiResultDto })
  @ApiResponse({
    status: 200,
    description: 'Resultado de IA registrado.',
    schema: {
      example: {
        id: 'ai-result-uuid-001', evaluationId: 'eval-uuid-0001',
        aiModelUsed: 'gpt-4o', aiResult: 'approved', aiScore: 82,
        aiConfidence: 0.91, processedAt: '2024-04-05T09:05:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'La evaluación ya está finalizada.' })
  submitAiResult(@Body() dto: SubmitAiResultDto) {
    return this.service.submitAiResult(dto);
  }

  @Post('human-review')
  @Roles(UserRole.EVALUATOR, UserRole.MENTOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Registrar revisión humana',
    description: 'El evaluador o mentor registra su revisión. Si ya existe una review para esa evaluación, se sobreescribe.',
  })
  @ApiBody({ type: SubmitHumanReviewDto })
  @ApiResponse({
    status: 200,
    description: 'Revisión humana registrada.',
    schema: {
      example: {
        id: 'hr-uuid-001', evaluationId: 'eval-uuid-0001',
        reviewerUserId: 'user-uuid-002', reviewDecision: 'approved',
        humanScore: 78, agreesWithAi: true, comment: 'Buen trabajo.',
        reviewedAt: '2024-04-05T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'La evaluación ya está finalizada.' })
  submitHumanReview(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Body() dto: SubmitHumanReviewDto,
  ) {
    return this.service.submitHumanReview(userId, role, dto);
  }

  @Post('finalize')
  @Roles(UserRole.ADMIN, UserRole.EVALUATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Finalizar una evaluación',
    description: `Consolida el veredicto final y cierra la evaluación. Actualiza el estado de la evidencia según el resultado:
- \`approved\` → evidencia pasa a \`approved\`, \`isValidForIc = true\`
- \`rejected\` → evidencia pasa a \`rejected\`
- \`needs_revision\` → evidencia vuelve a \`draft\``,
  })
  @ApiBody({ type: FinalizeEvaluationDto })
  @ApiResponse({
    status: 200,
    description: 'Evaluación finalizada.',
    schema: { example: { ...EXAMPLE_EVALUATION, evaluationResult: 'approved', score: 80, isFinal: true, evaluatedAt: '2024-04-05T11:00:00.000Z' } },
  })
  @ApiResponse({ status: 400, description: 'La evaluación ya estaba finalizada.' })
  finalizeEvaluation(@Body() dto: FinalizeEvaluationDto) {
    return this.service.finalizeEvaluation(dto);
  }

  @Get('pending-reviews')
  @Roles(UserRole.EVALUATOR, UserRole.MENTOR, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Listar evaluaciones pendientes de revisión humana',
    description: 'Devuelve evaluaciones de tipo `human` o `hybrid` que aún no tienen revisión humana registrada. Útil para el dashboard del evaluador.',
  })
  @ApiResponse({ status: 200, description: 'Lista de evaluaciones pendientes.', schema: { example: [EXAMPLE_EVALUATION] } })
  findPendingHumanReviews() {
    return this.service.findPendingHumanReviews();
  }

  @Get('evidence/:evidenceId')
  @Roles(UserRole.ENTREPRENEUR, UserRole.MENTOR, UserRole.EVALUATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar evaluaciones de una evidencia', description: 'Devuelve todas las evaluaciones de una evidencia, ordenadas por fecha descendente.' })
  @ApiParam({ name: 'evidenceId', description: 'UUID de la evidencia', example: 'ev-uuid-0001' })
  @ApiResponse({ status: 200, description: 'Evaluaciones de la evidencia.', schema: { example: [EXAMPLE_EVALUATION] } })
  findAllByEvidence(@Param('evidenceId', ParseUUIDPipe) evidenceId: string) {
    return this.service.findAllByEvidence(evidenceId);
  }

  @Get(':id')
  @Roles(UserRole.ENTREPRENEUR, UserRole.MENTOR, UserRole.EVALUATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener una evaluación por ID', description: 'Devuelve el detalle completo con resultado de IA, revisión humana y rúbrica.' })
  @ApiParam({ name: 'id', description: 'UUID de la evaluación', example: 'eval-uuid-0001' })
  @ApiResponse({ status: 200, description: 'Detalle de la evaluación.', schema: { example: EXAMPLE_EVALUATION } })
  @ApiResponse({ status: 404, description: 'Evaluación no encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneEvaluation(id);
  }

  // ══════════════════════════════════════════════════════════
  // RÚBRICAS
  // ══════════════════════════════════════════════════════════

  @Post('rubrics')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una rúbrica', description: 'Solo admin. El `code` debe ser único.' })
  @ApiBody({ type: CreateRubricDto })
  @ApiResponse({ status: 201, description: 'Rúbrica creada.', schema: { example: EXAMPLE_RUBRIC } })
  @ApiResponse({ status: 400, description: 'Ya existe una rúbrica con ese código.' })
  createRubric(@Body() dto: CreateRubricDto) {
    return this.service.createRubric(dto);
  }

  @Get('rubrics')
  @Roles(UserRole.ADMIN, UserRole.EVALUATOR, UserRole.MENTOR)
  @ApiOperation({ summary: 'Listar rúbricas activas', description: 'Devuelve todas las rúbricas con `isActive = true`.' })
  @ApiResponse({ status: 200, description: 'Lista de rúbricas.', schema: { example: [EXAMPLE_RUBRIC] } })
  findAllRubrics() {
    return this.service.findAllRubrics();
  }

  @Get('rubrics/:id')
  @Roles(UserRole.ADMIN, UserRole.EVALUATOR, UserRole.MENTOR)
  @ApiOperation({ summary: 'Obtener una rúbrica por ID' })
  @ApiParam({ name: 'id', description: 'UUID de la rúbrica', example: 'rubric-uuid-0001' })
  @ApiResponse({ status: 200, description: 'Detalle de la rúbrica.', schema: { example: EXAMPLE_RUBRIC } })
  @ApiResponse({ status: 404, description: 'Rúbrica no encontrada.' })
  findOneRubric(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOneRubric(id);
  }

  @Patch('rubrics/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar una rúbrica', description: 'Solo admin. Todos los campos son opcionales.' })
  @ApiParam({ name: 'id', description: 'UUID de la rúbrica', example: 'rubric-uuid-0001' })
  @ApiBody({ type: UpdateRubricDto })
  @ApiResponse({ status: 200, description: 'Rúbrica actualizada.', schema: { example: EXAMPLE_RUBRIC } })
  @ApiResponse({ status: 404, description: 'Rúbrica no encontrada.' })
  updateRubric(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRubricDto,
  ) {
    return this.service.updateRubric(id, dto);
  }
}