// src/reputation/dto/calculate-snapshot.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional } from 'class-validator';

export class CalculateSnapshotDto {
  @ApiProperty({ description: 'Proyecto a calcular' })
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ description: 'Usuario específico. Si se omite se usa el owner del proyecto.' })
  @IsUUID()
  @IsOptional()
  userId?: string;
}