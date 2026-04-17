import { IsString, IsOptional, IsBoolean, IsObject, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRubricDto {
  @ApiPropertyOptional({ description: 'Nuevo nombre de la rúbrica', example: 'Rúbrica de entrevistas v2' })
  @IsOptional() @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Nueva descripción', example: 'Versión actualizada con criterios ampliados.' })
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Nueva versión', example: 'v2.0' })
  @IsOptional() @IsString()
  version?: string;

  @ApiPropertyOptional({ description: 'Criterios actualizados en formato JSON', example: { dimensions: [] } })
  @IsOptional() @IsObject()
  criteriaJson?: object;

  @ApiPropertyOptional({ description: 'Referencia al framework', example: 'Jobs To Be Done' })
  @IsOptional() @IsString()
  frameworkReference?: string;

  @ApiPropertyOptional({ description: 'Activar o desactivar la rúbrica', example: false })
  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Nueva fecha de inicio de vigencia', example: '2025-01-01' })
  @IsOptional() @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Nueva fecha de fin de vigencia', example: '2026-12-31' })
  @IsOptional() @IsDateString()
  validTo?: string;
}