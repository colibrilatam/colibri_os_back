import { IsUUID, IsEnum, IsOptional, IsString, IsNumber, IsBoolean, IsObject, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewDecision } from '../entities/evaluation.enums';

export class SubmitHumanReviewDto {
  @ApiProperty({ description: 'UUID de la evaluación a revisar', example: 'eval-uuid-0001' })
  @IsUUID()
  evaluationId: string;

  @ApiProperty({ description: 'Decisión del revisor humano', enum: ReviewDecision, example: ReviewDecision.APPROVED })
  @IsEnum(ReviewDecision)
  reviewDecision: ReviewDecision;

  @ApiPropertyOptional({ description: 'Puntaje asignado por el revisor humano (0-100)', example: 78, minimum: 0, maximum: 100 })
  @IsOptional() @IsNumber() @Min(0) @Max(100)
  humanScore?: number;

  @ApiPropertyOptional({ description: 'Puntajes por dimensión asignados por el humano', example: { consistency: 80, collaboration: 75, sustainability: 79 } })
  @IsOptional() @IsObject()
  humanDimensionScoresJson?: object;

  @ApiPropertyOptional({ description: 'Si es true, el revisor coincide con el veredicto de la IA', example: true })
  @IsOptional() @IsBoolean()
  agreesWithAi?: boolean;

  @ApiPropertyOptional({ description: 'Justificación cuando el revisor anula o modifica el resultado de la IA', example: 'El documento adjunto no corresponde al formato solicitado.' })
  @IsOptional() @IsString()
  overrideReason?: string;

  @ApiPropertyOptional({ description: 'Comentario libre del revisor para el emprendedor', example: 'Buen trabajo, pero faltó incluir el tamaño de muestra.' })
  @IsOptional() @IsString()
  comment?: string;
}