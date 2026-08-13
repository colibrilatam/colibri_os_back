// src/tramo-closure/dto/close-tramo.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, MaxLength } from 'class-validator';

export class CloseTramoDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsUUID() tramoId: string;

  @ApiPropertyOptional({ description: 'Versión visual nueva del NFT, ej: v2' })
  @IsString()
  @IsOptional()
  newVisualVersion?: string;

  @ApiPropertyOptional({
    description:
      'Clave de idempotencia para reintentos seguros. Si se omite, se usa ' +
      '`${projectId}:${tramoId}`. Reintentar con la misma clave nunca duplica efectos.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  idempotencyKey?: string;
}