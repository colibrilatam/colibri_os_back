// src/categories/dto/create-category.dto.ts
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UncertaintyType, RiskType } from '../../curriculum/entities/curriculum.enums';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'UUID del tramo al que pertenece esta categoría',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  @IsNotEmpty()
  tramoId: string;

  @ApiProperty({
    description: 'Código único identificador de la categoría dentro del sistema curricular',
    example: 'CAT-T1-01',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Nombre descriptivo de la categoría',
    example: 'Validación de Problema',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del propósito y alcance de la categoría',
    example: 'Categoría orientada a validar hipótesis iniciales del problema que resuelve el proyecto.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Orden de visualización de la categoría dentro del tramo (ascendente)',
    example: 1,
  })
  @IsInt()
  sortOrder: number;

  @ApiPropertyOptional({
    description: 'Cantidad de días disponibles para ejecutar los PACs de esta categoría',
    example: 14,
  })
  @IsInt()
  @IsOptional()
  executionWindowDays?: number;

  @ApiPropertyOptional({
    description: 'Tipo de incertidumbre que aborda esta categoría según el currículo Colibrí',
    enum: UncertaintyType,
    example: UncertaintyType.MARKET,
  })
  @IsEnum(UncertaintyType)
  @IsOptional()
  uncertaintyType?: UncertaintyType;

  @ApiPropertyOptional({
    description: 'Tipo de riesgo primario asociado a los PACs de esta categoría',
    enum: RiskType,
    example: RiskType.DESIRABILITY,
  })
  @IsEnum(RiskType)
  @IsOptional()
  primaryRiskType?: RiskType;

  @ApiPropertyOptional({
    description: 'Clave de mapeo hacia el modelo de competencias del currículo',
    example: 'COMP_EMPATHY',
  })
  @IsString()
  @IsOptional()
  competencyMappingKey?: string;

  @ApiPropertyOptional({
    description: 'Clave de mapeo hacia una habilidad específica del currículo',
    example: 'SKILL_CUSTOMER_DISCOVERY',
  })
  @IsString()
  @IsOptional()
  skillMappingKey?: string;

  @ApiPropertyOptional({
    description: 'Clave de mapeo hacia el conjunto de habilidades agrupadas de la categoría',
    example: 'SKILLS_VALIDATION',
  })
  @IsString()
  @IsOptional()
  skillsKey?: string;

  @ApiPropertyOptional({
    description: 'Indica si la categoría está activa y disponible para los emprendedores. Por defecto: true',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Fecha desde la cual la categoría es válida (ISO 8601)',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsOptional()
  validFrom?: Date;

  @ApiPropertyOptional({
    description: 'Fecha hasta la cual la categoría es válida (ISO 8601). Null = sin expiración',
    example: '2024-12-31',
  })
  @IsDateString()
  @IsOptional()
  validTo?: Date;
}