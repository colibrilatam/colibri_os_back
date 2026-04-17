import { IsUUID, IsEnum, IsOptional, IsNumber, Min, Max, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EvaluationType } from '../entities/evaluation.enums';

export class CreateEvaluationDto {
  @ApiProperty({ description: 'UUID de la evidencia a evaluar. Debe estar en estado `submitted`.', example: 'ev-uuid-0001' })
  @IsUUID()
  evidenceId: string;

  @ApiProperty({ description: 'UUID de la rúbrica activa a aplicar', example: 'rubric-uuid-0001' })
  @IsUUID()
  rubricId: string;

  @ApiProperty({ description: 'Versión de la rúbrica al momento de crear la evaluación', example: 'v1.0' })
  @IsString()
  rubricVersion: string;

  @ApiPropertyOptional({
    description: 'Tipo de evaluación. `automatic` = solo IA; `human` = solo humano; `hybrid` = ambos (default)',
    enum: EvaluationType,
    example: EvaluationType.HYBRID,
    default: EvaluationType.HYBRID,
  })
  @IsOptional() @IsEnum(EvaluationType)
  evaluationType?: EvaluationType;

  @ApiPropertyOptional({
    description: 'Peso relativo del resultado de IA vs humano en el veredicto final (0 = solo humano, 1 = solo IA)',
    example: 0.5,
    minimum: 0,
    maximum: 1,
    default: 0.5,
  })
  @IsOptional() @IsNumber() @Min(0) @Max(1)
  evaluationSourceWeight?: number;
}