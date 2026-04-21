import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { ProjectStatus, TrajectoryStatus } from '../entities/project.entity';
import { Transform } from 'class-transformer';

export class CreateProjectDto {
  @ApiProperty({ example: 'Mi Startup' })
  @IsString()
  @IsNotEmpty()
  projectName: string;

  // En CreateProjectDto, podés agregar opcionalmente:
  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Imagen del proyecto' })
  @IsOptional()
  image?: any;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsEnum(ProjectStatus)
  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase())
  status?: ProjectStatus;

  @ApiPropertyOptional({ example: 'Argentina' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: 'Tecnología' })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional({ example: 'La mejor solución para X' })
  @IsString()
  @IsOptional()
  tagline?: string;

  @ApiPropertyOptional({ example: 'Descripción corta del proyecto' })
  @IsString()
  @IsOptional()
  shortDescription?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/company/mi-startup' })
  @IsUrl()
  @IsOptional()
  startupLinkedinUrl?: string;

  @ApiPropertyOptional({ example: 'https://mistartup.com' })
  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @ApiPropertyOptional({ example: 'https://rlab.com/mi-startup' })
  @IsUrl()
  @IsOptional()
  rlabProfileUrl?: string;

  @ApiPropertyOptional({ enum: TrajectoryStatus })
  @IsEnum(TrajectoryStatus)
  @IsOptional()
  trajectoryStatus?: TrajectoryStatus;
}