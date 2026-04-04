// src/evidence/dto/create-evidence.dto.ts

import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';
import { EvidenceType } from '../../micro-action-definitions/entities/micro-action-definition.entity';
import { PrivacyLevel } from '../entities/evidence.entity';

export class CreateEvidenceDto {
  @IsUUID()
  microActionInstanceId: string;

  @IsUUID()
  projectId: string;

  @IsEnum(EvidenceType)
  evidenceType: EvidenceType;

  @IsOptional()
  @IsString()
  description?: string;

  // Solo para evidencias de tipo TEXT o LINK — se carga directo sin archivo
  @IsOptional()
  @IsString()
  canonicalUri?: string;

  @IsOptional()
  @IsEnum(PrivacyLevel)
  privacyLevel?: PrivacyLevel;

  @IsOptional()
  @IsBoolean()
  publicSignalEnabled?: boolean;
}