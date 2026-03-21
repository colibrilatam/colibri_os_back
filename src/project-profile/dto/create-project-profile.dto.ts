import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateProjectProfileDto {
  @ApiPropertyOptional({ example: 'Descripción extensa del proyecto...' })
  @IsString()
  @IsOptional()
  longDescription?: string;

  @ApiPropertyOptional({ example: 'El problema que resolvemos es...' })
  @IsString()
  @IsOptional()
  problemStatement?: string;

  @ApiPropertyOptional({ example: 'Nuestra solución consiste en...' })
  @IsString()
  @IsOptional()
  solutionStatement?: string;

  @ApiPropertyOptional({ example: 'Emprendedores entre 25 y 40 años' })
  @IsString()
  @IsOptional()
  targetAudience?: string;

  @ApiPropertyOptional({ example: ['1', '4', '8'], type: [String] })
  @IsArray()
  @IsOptional()
  sdgGoals?: string[];

  @ApiPropertyOptional({ example: 'Nuestra propuesta de valor es...' })
  @IsString()
  @IsOptional()
  valueProposition?: string;

  @ApiPropertyOptional({ example: 'Modelo de suscripción mensual' })
  @IsString()
  @IsOptional()
  businessModelSummary?: string;

  @ApiPropertyOptional({ example: 'Etapa de validación con primeros clientes' })
  @IsString()
  @IsOptional()
  stageNotes?: string;

  @ApiPropertyOptional({ example: 'https://pitch.com/mi-startup' })
  @IsUrl()
  @IsOptional()
  pitchUrl?: string;
}