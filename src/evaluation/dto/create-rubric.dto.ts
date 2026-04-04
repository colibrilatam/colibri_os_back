// src/evaluation/dto/create-rubric.dto.ts

import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsObject,
  IsDateString,
} from 'class-validator';
import { RubricTargetEntity } from '../entities/rubric.entity';

export class CreateRubricDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(RubricTargetEntity)
  targetEntity: RubricTargetEntity;

  @IsString()
  version: string;

  @IsObject()
  criteriaJson: object;

  @IsOptional()
  @IsString()
  frameworkReference?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;
}