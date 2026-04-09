// src/evidence/dto/request-upload-signature.dto.ts

import { IsString, IsEnum, IsUUID } from 'class-validator';
import { EvidenceType } from '../../micro-action-definitions/entities/micro-action-definition.entity';

export class RequestUploadSignatureDto {
  @IsUUID()
  evidenceId: string;

  // MIME type del archivo: "application/pdf", "video/mp4", etc.
  @IsString()
  mimeType: string;

  @IsEnum(EvidenceType)
  evidenceType: EvidenceType;
}