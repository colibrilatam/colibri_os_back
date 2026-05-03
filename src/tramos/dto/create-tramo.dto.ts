// src/curriculum/dto/create-tramo.dto.ts
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UncertaintyType, RiskType } from '../entities/tramo.entity';

export class CreateTramoDto {
  @ApiProperty({
    description: 'Código único identificador del tramo dentro del sistema curricular',
    example: 'TRAMO-01',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Nombre descriptivo del tramo',
    example: 'Fase Fundacional',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del propósito y alcance del tramo',
    example: 'Primer tramo del recorrido Colibrí. El emprendedor valida su problema y define su propuesta de valor.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Orden de visualización del tramo en la Ruta de Vuelo (ascendente)',
    example: 1,
  })
  @IsInt()
  sortOrder: number;

  @ApiPropertyOptional({
    description: 'Cantidad de días disponibles para completar el tramo',
    example: 90,
  })
  @IsInt()
  @IsOptional()
  executionWindowDays?: number;

  @ApiPropertyOptional({
    description: 'Tipo de incertidumbre principal que aborda este tramo',
    enum: UncertaintyType,
    example: UncertaintyType.MARKET,
  })
  @IsEnum(UncertaintyType)
  @IsOptional()
  uncertaintyType?: UncertaintyType;

  @ApiPropertyOptional({
    description: 'Tipo de riesgo primario que enfrenta el emprendedor en este tramo',
    enum: RiskType,
    example: RiskType.DEMANDA,
  })
  @IsEnum(RiskType)
  @IsOptional()
  primaryRiskType?: RiskType;

  @ApiPropertyOptional({
    description: 'Índice de Credibilidad (IC) mínimo requerido para acceder a este tramo',
    example: 0.6,
  })
  @IsNumber()
  @IsOptional()
  icFloor?: number;

  @ApiPropertyOptional({
    description: 'Regla de elegibilidad en formato texto o expresión evaluable que determina si un proyecto puede ingresar al tramo',
    example: 'ic >= 0.6 AND evidencias_aprobadas >= 7',
  })
  @IsString()
  @IsOptional()
  eligibilityRule?: string;

  @ApiPropertyOptional({
    description: 'Umbral de IC a partir del cual el proyecto es visible públicamente en el ecosistema',
    example: 0.75,
  })
  @IsNumber()
  @IsOptional()
  publicThreshold?: number;

  @ApiPropertyOptional({
    description: 'Indica si el tramo está activo y disponible en la Ruta de Vuelo. Por defecto: true',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Fecha desde la cual el tramo es válido (ISO 8601)',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsOptional()
  validFrom?: Date;

  @ApiPropertyOptional({
    description: 'Fecha hasta la cual el tramo es válido (ISO 8601). Null = sin expiración',
    example: '2024-12-31',
  })
  @IsDateString()
  @IsOptional()
  validTo?: Date;
}