import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PrivacyLevel } from '../entities/evidence.entity';

export class UpdateEvidenceDto {
  @ApiPropertyOptional({ description: 'Nueva descripción de la evidencia', example: 'Se actualizó el documento con los hallazgos finales.' })
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Nuevo nivel de privacidad', enum: PrivacyLevel, example: PrivacyLevel.PUBLIC })
  @IsOptional() @IsEnum(PrivacyLevel)
  privacyLevel?: PrivacyLevel;

  @ApiPropertyOptional({ description: 'Habilitar o deshabilitar señal pública en Reputation Lab', example: true })
  @IsOptional() @IsBoolean()
  publicSignalEnabled?: boolean;
}