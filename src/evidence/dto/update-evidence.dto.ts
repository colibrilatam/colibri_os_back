// src/evidence/dto/update-evidence.dto.ts

import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { PrivacyLevel } from '../entities/evidence.entity';

export class UpdateEvidenceDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(PrivacyLevel)
  privacyLevel?: PrivacyLevel;

  @IsOptional()
  @IsBoolean()
  publicSignalEnabled?: boolean;
}