// src/evaluation/dto/submit-ai-result.dto.ts

import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { EvaluationResult } from '../entities/evaluation.enums';

export class SubmitAiResultDto {
  @IsUUID()
  evaluationId: string;

  @IsString()
  aiModelUsed: string;

  @IsOptional()
  @IsString()
  aiModelVersion?: string;

  @IsEnum(EvaluationResult)
  aiResult: EvaluationResult;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  aiScore?: number;

  @IsOptional()
  @IsObject()
  aiDimensionScoresJson?: object;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  aiConfidence?: number;

  @IsOptional()
  @IsString()
  aiReasoning?: string;

  @IsOptional()
  @IsObject()
  rawResponseJson?: object;
}