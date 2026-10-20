import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectPacStatus } from '../entities/project.pac.entity';
import { PacResponseDto } from '../../pacs/dto/pac-response.dto';

export class ProjectPacResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  projectId: string;

  @ApiProperty({ type: String, format: 'uuid' })
  pacId: string;

  @ApiProperty({ enum: ProjectPacStatus })
  status: ProjectPacStatus;

  @ApiPropertyOptional({ type: String, nullable: true })
  progress: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  startedAt: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  completedAt: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: PacResponseDto })
  pac?: PacResponseDto;
}
