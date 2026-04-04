// src/evidence/dto/request-upload-url.dto.ts
// El emprendedor pide una URL para subir su archivo a Google Drive

import { IsString, IsEnum, IsUUID } from 'class-validator';
import { EvidenceType } from '../../micro-action-definitions/entities/micro-action-definition.entity';

export class RequestUploadUrlDto {
  @IsUUID()
  evidenceId: string;

  // Nombre original del archivo: "mi-investigacion.pdf"
  @IsString()
  fileName: string;

  // MIME type: "application/pdf", "video/mp4", etc.
  @IsString()
  mimeType: string;

  @IsEnum(EvidenceType)
  evidenceType: EvidenceType;
}