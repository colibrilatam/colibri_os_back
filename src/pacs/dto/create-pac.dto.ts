import {
  IsBoolean, IsDateString, IsInt, IsNotEmpty,
  IsNumber, IsOptional, IsString, IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePacDto {
  @ApiProperty({ description: 'UUID de la categoría a la que pertenece este PAC', example: 'cat-uuid-0001' })
  @IsUUID() @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ description: 'Código único del PAC', example: 'PAC-T1-001' })
  @IsString() @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Título del PAC', example: 'Descubrimiento de usuario' })
  @IsString() @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Línea objetiva del PAC', example: 'Validar la existencia del problema con usuarios reales.' })
  @IsString() @IsOptional()
  objectiveLine?: string;

  @ApiPropertyOptional({ description: 'Descripción detallada del PAC', example: 'El emprendedor debe realizar entrevistas y documentar hallazgos.' })
  @IsString() @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Orden de aparición dentro de la categoría', example: 1 })
  @IsInt()
  sortOrder: number;

  @ApiPropertyOptional({ description: 'Ventana de tiempo en días para completar el PAC', example: 14 })
  @IsInt() @IsOptional()
  executionWindowDays?: number;

  @ApiPropertyOptional({ description: 'Umbral mínimo de completitud para considerar el PAC cerrado (0-100)', example: 80 })
  @IsNumber() @IsOptional()
  minimumCompletionThreshold?: number;

  @ApiPropertyOptional({ description: 'Peso del PAC en el cálculo del IC del proyecto (0-100)', example: 15.5 })
  @IsNumber() @IsOptional()
  icWeight?: number;

  @ApiPropertyOptional({ description: 'Regla de cierre del PAC (expresión lógica o texto descriptivo)', example: 'Requiere aprobación de las 3 microacciones obligatorias.' })
  @IsString() @IsOptional()
  closureRule?: string;

  @ApiPropertyOptional({ description: 'Versión del template del PAC', example: 'v1.2' })
  @IsString() @IsOptional()
  templateVersion?: string;

  @ApiPropertyOptional({ description: 'Si es false, el PAC no aparece en la ruta activa', example: true, default: true })
  @IsBoolean() @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Fecha desde la cual el PAC está vigente', example: '2024-01-01' })
  @IsDateString() @IsOptional()
  validFrom?: Date;

  @ApiPropertyOptional({ description: 'Fecha hasta la cual el PAC está vigente', example: '2025-12-31' })
  @IsDateString() @IsOptional()
  validTo?: Date;
}