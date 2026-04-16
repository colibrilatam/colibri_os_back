// src/tramos/dto/change-tramo.dto.ts
import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChangeTramoDto {
  @ApiProperty({
    description: 'UUID del nuevo tramo al que se moverá el proyecto',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  newTramoId: string;

  @ApiPropertyOptional({
    description: 'Motivo del cambio de tramo (ej: avance curricular, corrección administrativa)',
    example: 'El proyecto completó todas las evidencias del Tramo 1 y avanza al Tramo 2.',
  })
  @IsOptional()
  @IsString()
  changeReason?: string;
}