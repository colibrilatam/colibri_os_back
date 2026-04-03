// src/evidence/dto/submit-evidence.dto.ts
// Acción explícita de envío a revisión

import { IsUUID } from 'class-validator';

export class SubmitEvidenceDto {
  @IsUUID()
  evidenceId: string;
}