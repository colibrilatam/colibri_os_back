// src/categories/dto/create-category.dto.ts
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { UncertaintyType, RiskType } from '../../curriculum/entities/curriculum.enums';

export class CreateCategoryDto {
  @IsUUID()
  @IsNotEmpty()
  tramoId: string;

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

  @IsString()
  @IsOptional()
  competencyMappingKey?: string;

  @IsString()
  @IsOptional()
  skillMappingKey?: string;

  @IsString()
  @IsOptional()
  skillsKey?: string;

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