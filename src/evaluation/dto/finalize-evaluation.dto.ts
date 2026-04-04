// src/evaluation/dto/finalize-evaluation.dto.ts

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

export class FinalizeEvaluationDto {
  @IsUUID()
  evaluationId: string;

  @IsEnum(EvaluationResult)
  evaluationResult: EvaluationResult;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;

  @IsOptional()
  @IsObject()
  dimensionScoresJson?: object;

  @IsOptional()
  @IsString()
  comment?: string;
}