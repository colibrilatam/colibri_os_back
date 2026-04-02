// src/micro-action-definitions/dto/create-micro-action-definition.dto.ts
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  MicroActionType,
  EvidenceType,
} from '../entities/micro-action-definition.entity';

export class CreateMicroActionDefinitionDto {
  @IsUUID()
  @IsNotEmpty()
  pacId: string;

  @IsUUID()
  @IsOptional()
  rubricId?: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  instruction: string;

  @IsInt()
  sortOrder: number;

  @IsInt()
  @IsOptional()
  executionWindowDays?: number;

  @IsEnum(MicroActionType)
  @IsOptional()
  microActionType?: MicroActionType;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsBoolean()
  @IsOptional()
  isReusable?: boolean;

  @IsBoolean()
  @IsOptional()
  evidenceRequired?: boolean;

  @IsEnum(EvidenceType)
  @IsOptional()
  expectedEvidenceType?: EvidenceType;

  @IsNumber()
  @IsOptional()
  consistencyWeight?: number;

  @IsNumber()
  @IsOptional()
  collaborationWeight?: number;

  @IsNumber()
  @IsOptional()
  sustainabilityWeight?: number;

  @IsDateString()
  @IsOptional()
  validFrom?: Date;

  @IsDateString()
  @IsOptional()
  validTo?: Date;
}