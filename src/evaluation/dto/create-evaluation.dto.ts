// src/evaluation/dto/create-evaluation.dto.ts

import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { EvaluationType } from '../entities/evaluation.enums';

export class CreateEvaluationDto {
  @IsUUID()
  evidenceId: string;

  @IsUUID()
  rubricId: string;

  @IsString()
  rubricVersion: string;

  @IsOptional()
  @IsEnum(EvaluationType)
  evaluationType?: EvaluationType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  evaluationSourceWeight?: number;
}