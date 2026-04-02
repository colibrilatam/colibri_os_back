// src/curriculum/dto/create-tramo.dto.ts
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { UncertaintyType, RiskType } from '../entities/tramo.entity';

export class CreateTramoDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  sortOrder: number;

  @IsInt()
  @IsOptional()
  executionWindowDays?: number;

  @IsEnum(UncertaintyType)
  @IsOptional()
  uncertaintyType?: UncertaintyType;

  @IsEnum(RiskType)
  @IsOptional()
  primaryRiskType?: RiskType;

  @IsNumber()
  @IsOptional()
  icFloor?: number;

  @IsString()
  @IsOptional()
  eligibilityRule?: string;

  @IsNumber()
  @IsOptional()
  publicThreshold?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  @IsOptional()
  validFrom?: Date;

  @IsDateString()
  @IsOptional()
  validTo?: Date;
}