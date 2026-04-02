// src/pacs/dto/create-pac.dto.ts
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreatePacDto {
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  objectiveLine?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  sortOrder: number;

  @IsInt()
  @IsOptional()
  executionWindowDays?: number;

  @IsNumber()
  @IsOptional()
  minimumCompletionThreshold?: number;

  @IsNumber()
  @IsOptional()
  icWeight?: number;

  @IsString()
  @IsOptional()
  closureRule?: string;

  @IsString()
  @IsOptional()
  templateVersion?: string;

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