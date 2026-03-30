import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { ResourceType } from 'src/curriculum/entities/learning-resource.entity';

export class CreateLearningResourceDto {
  @ApiProperty({
    description: 'ID del Protocolo de Acción Colibrí (PAC) al que pertenece el recurso',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  @IsNotEmpty()
  pacId: string;

  @ApiProperty({
    description: 'Título del recurso',
    example: 'Introducción a TypeScript',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: 'Tipo de recurso',
    example: 'video',
    enum: ResourceType,
  })
  @IsEnum(ResourceType, {
    message: `El tipo de recurso debe ser uno de: ${Object.values(ResourceType).join(', ')}`,
  })
  resourceType: ResourceType;

  @ApiProperty({
    description: 'URL del recurso',
    example: 'https://www.example.com/learning-resource',
  })
  @IsUrl({}, { message: 'La URL no es válida' })
  @MaxLength(2048)
  url: string;

  @ApiProperty({
    description: 'Descripción del recurso',
    example: 'Un recurso de aprendizaje sobre TypeScript',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Orden de presentación del recurso dentro del PAC',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder: number;

  @ApiProperty({
    description: 'Indica si el recurso es obligatorio o solo recomendado.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isRequired: boolean;

  @ApiProperty({
    description: 'ID de la Microacción específica a la que se vincula el recurso, si aplica',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  microActionDefinitionId?: string;
}