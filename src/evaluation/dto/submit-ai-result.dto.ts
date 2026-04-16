import { IsUUID, IsEnum, IsOptional, IsString, IsNumber, IsObject, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EvaluationResult } from '../entities/evaluation.enums';

export class SubmitAiResultDto {
  @ApiProperty({ description: 'UUID de la evaluación a la que se adjunta el resultado de IA', example: 'eval-uuid-0001' })
  @IsUUID()
  evaluationId: string;

  @ApiProperty({ description: 'Identificador del modelo de IA utilizado', example: 'gpt-4o' })
  @IsString()
  aiModelUsed: string;

  @ApiPropertyOptional({ description: 'Versión específica del modelo', example: '2024-05-13' })
  @IsOptional() @IsString()
  aiModelVersion?: string;

  @ApiProperty({ description: 'Veredicto emitido por la IA', enum: EvaluationResult, example: EvaluationResult.APPROVED })
  @IsEnum(EvaluationResult)
  aiResult: EvaluationResult;

  @ApiPropertyOptional({ description: 'Puntaje global asignado por la IA (0-100)', example: 82, minimum: 0, maximum: 100 })
  @IsOptional() @IsNumber() @Min(0) @Max(100)
  aiScore?: number;

  @ApiPropertyOptional({
    description: 'Puntajes por dimensión de la rúbrica en formato JSON',
    example: { consistency: 85, collaboration: 78, sustainability: 83 },
  })
  @IsOptional() @IsObject()
  aiDimensionScoresJson?: object;

  @ApiPropertyOptional({ description: 'Nivel de confianza del modelo en su veredicto (0-1)', example: 0.91, minimum: 0, maximum: 1 })
  @IsOptional() @IsNumber() @Min(0) @Max(1)
  aiConfidence?: number;

  @ApiPropertyOptional({ description: 'Razonamiento textual del modelo', example: 'La evidencia cumple con todos los criterios de la rúbrica.' })
  @IsOptional() @IsString()
  aiReasoning?: string;

  @ApiPropertyOptional({ description: 'Respuesta completa del modelo en crudo (para auditoría)', example: { choices: [{ message: { content: '...' } }] } })
  @IsOptional() @IsObject()
  rawResponseJson?: object;
}