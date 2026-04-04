// src/evidence/dto/confirm-upload.dto.ts
// El emprendedor confirma que el archivo ya fue subido a Drive

import { IsUUID, IsString, IsOptional, IsBoolean } from 'class-validator';

export class ConfirmUploadDto {
  @IsUUID()
  evidenceId: string;

  // File ID que devolvió Google Drive después del upload
  @IsString()
  driveFileId: string;

  // URL pública o compartida del archivo en Drive
  @IsString()
  storageUri: string;

  @IsOptional()
  @IsString()
  changeSummary?: string;

  @IsOptional()
  @IsBoolean()
  isMaterialChange?: boolean;
}