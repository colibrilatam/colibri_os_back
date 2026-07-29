import { IsUUID, IsEnum, IsOptional, IsString, IsBoolean, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EvidenceType } from '../../micro-action-definitions/entities/micro-action-definition.entity';
import { PrivacyLevel } from '../entities/evidence.entity';

export class CreateEvidenceDto {
  @ApiProperty({
    description: 'UUID de la instancia de microacción a la que pertenece esta evidencia',
    example: 'mai-uuid-0001',
  })
  @IsUUID()
  microActionInstanceId: string;

  @ApiProperty({ description: 'Tipo de evidencia', enum: EvidenceType, example: EvidenceType.FILE })
  @IsEnum(EvidenceType)
  evidenceType: EvidenceType;

  @ApiPropertyOptional({
    description: 'Descripción libre de la evidencia',
    example: 'Documento con los hallazgos de las 5 entrevistas realizadas.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'URL para evidencias de tipo TEXT o LINK sin archivo adjunto',
    example: 'https://docs.google.com/document/d/abc123',
  })
  @IsOptional()
  @IsUrl()
  canonicalUri?: string;

  @ApiPropertyOptional({
    description: 'Nivel de privacidad de la evidencia',
    enum: PrivacyLevel,
    example: PrivacyLevel.PRIVATE,
    default: PrivacyLevel.PRIVATE,
  })
  @IsOptional()
  @IsEnum(PrivacyLevel)
  privacyLevel?: PrivacyLevel;

  @ApiPropertyOptional({
    description: 'Si es true, la evidencia puede usarse como señal pública en Reputation Lab',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  publicSignalEnabled?: boolean;
}
