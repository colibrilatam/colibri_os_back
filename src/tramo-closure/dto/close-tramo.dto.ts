// src/tramo-closure/dto/close-tramo.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional } from 'class-validator';

export class CloseTramoDto {
  @ApiProperty() @IsUUID() projectId: string;
  @ApiProperty() @IsUUID() tramoId: string;
  @ApiPropertyOptional({ description: 'Versión visual nueva del NFT, ej: v2' })
  @IsString() @IsOptional() newVisualVersion?: string;
}