// src/evaluation/dto/submit-human-review.dto.ts

import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { ReviewDecision } from '../entities/evaluation.enums';

export class SubmitHumanReviewDto {
  @IsUUID()
  evaluationId: string;

  @IsEnum(ReviewDecision)
  reviewDecision: ReviewDecision;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  humanScore?: number;

  @IsOptional()
  @IsObject()
  humanDimensionScoresJson?: object;

  @IsOptional()
  @IsBoolean()
  agreesWithAi?: boolean;

  @IsOptional()
  @IsString()
  overrideReason?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}