import { IsString, IsEnum, IsOptional, IsBoolean, IsObject, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RubricTargetEntity } from '../entities/rubric.entity';

export class CreateRubricDto {
  @ApiProperty({ description: 'Código único de la rúbrica', example: 'RUB-ENTREVISTAS-V1' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Nombre descriptivo de la rúbrica', example: 'Rúbrica de entrevistas de descubrimiento' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descripción del propósito de la rúbrica', example: 'Evalúa la calidad y profundidad de las entrevistas realizadas.' })
  @IsOptional() @IsString()
  description?: string;

  @ApiProperty({ description: 'Entidad objetivo que evalúa esta rúbrica', enum: RubricTargetEntity, example: RubricTargetEntity.EVIDENCE })
  @IsEnum(RubricTargetEntity)
  targetEntity: RubricTargetEntity;

  @ApiProperty({ description: 'Versión de la rúbrica', example: 'v1.0' })
  @IsString()
  version: string;

  @ApiProperty({
    description: 'Criterios de evaluación en formato JSON. Estructura libre según la rúbrica.',
    example: { dimensions: [{ name: 'consistency', weight: 0.33, criteria: 'El emprendedor realizó al menos 5 entrevistas.' }] },
  })
  @IsObject()
  criteriaJson: object;

  @ApiPropertyOptional({ description: 'Referencia al framework de evaluación utilizado', example: 'Lean Startup - Customer Discovery' })
  @IsOptional() @IsString()
  frameworkReference?: string;

  @ApiPropertyOptional({ description: 'Si es false, la rúbrica no estará disponible para nuevas evaluaciones', example: true, default: true })
  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Fecha desde la cual la rúbrica está vigente', example: '2024-01-01' })
  @IsOptional() @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Fecha hasta la cual la rúbrica está vigente', example: '2025-12-31' })
  @IsOptional() @IsDateString()
  validTo?: string;
}