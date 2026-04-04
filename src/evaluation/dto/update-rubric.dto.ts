// src/evaluation/dto/update-rubric.dto.ts

import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  IsDateString,
} from 'class-validator';

export class UpdateRubricDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsObject()
  criteriaJson?: object;

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