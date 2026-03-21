import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { ProjectStatus, TrajectoryStatus } from '../entities/project.entity';

export class CreateProjectDto {
  @ApiProperty({ example: 'Mi Startup' })
  @IsString()
  @IsNotEmpty()
  projectName: string;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsEnum(ProjectStatus)
  @IsOptional()
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