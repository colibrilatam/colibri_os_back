// src/evidence/dto/confirm-upload.dto.ts

import { IsUUID, IsString, IsOptional, IsBoolean } from 'class-validator';

export class ConfirmUploadDto {
  @IsUUID()
  evidenceId: string;

  // Public ID devuelto por Cloudinary después del upload
  @IsString()
  cloudinaryPublicId: string;

  // URL segura devuelta por Cloudinary (secure_url)
  @IsString()
  storageUri: string;

  // MIME type del archivo subido — necesario para saber el resourceType
  @IsString()
  mimeType: string;

  @IsOptional()
  @IsString()
  changeSummary?: string;

  @IsOptional()
  @IsBoolean()
  isMaterialChange?: boolean;
}