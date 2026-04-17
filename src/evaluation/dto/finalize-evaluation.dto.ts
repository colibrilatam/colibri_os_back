import { IsUUID, IsEnum, IsOptional, IsString, IsNumber, IsObject, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EvaluationResult } from '../entities/evaluation.enums';

export class FinalizeEvaluationDto {
  @ApiProperty({ description: 'UUID de la evaluación a finalizar', example: 'eval-uuid-0001' })
  @IsUUID()
  evaluationId: string;

  @ApiProperty({
    description: 'Veredicto final de la evaluación. `approved` → evidencia aprobada; `rejected` → rechazada; `needs_revision` → vuelve a draft.',
    enum: EvaluationResult,
    example: EvaluationResult.APPROVED,
  })
  @IsEnum(EvaluationResult)
  evaluationResult: EvaluationResult;

  @ApiPropertyOptional({ description: 'Puntaje final consolidado (0-100)', example: 80, minimum: 0, maximum: 100 })
  @IsOptional() @IsNumber() @Min(0) @Max(100)
  score?: number;

  @ApiPropertyOptional({ description: 'Puntajes finales por dimensión', example: { consistency: 82, collaboration: 77, sustainability: 81 } })
  @IsOptional() @IsObject()
  dimensionScoresJson?: object;

  @ApiPropertyOptional({ description: 'Comentario final que verá el emprendedor', example: 'Evidencia aprobada. Excelente trabajo de investigación.' })
  @IsOptional() @IsString()
  comment?: string;
}