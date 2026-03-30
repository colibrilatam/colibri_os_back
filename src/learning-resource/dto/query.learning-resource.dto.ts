import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ResourceType } from 'src/curriculum/entities/learning-resource.entity';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryLearningResourceDto {
  @ApiPropertyOptional({
    description: 'Filtrar por pacId',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  pacId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por microActionDefinitionId',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  microActionDefinitionId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de recurso',
    example: 'video',
    enum: ResourceType,
  })
  @IsOptional()
  @IsEnum(ResourceType)
  resourceType?: ResourceType;

  @ApiPropertyOptional({
    description: 'Filtrar por estado activo',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por si es requerido',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Número de página para paginación',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Límite de resultados por página',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}