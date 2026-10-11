import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus, TrajectoryStatus } from '../entities/project.entity';
import { UserResponseDto } from '../../users/dtos/user-response.dto';
import { ProjectProfileResponseDto } from '../../project-profile/dto/project-profile-response.dto';
import { ProjectMemberResponseDto } from '../../project-members/dto/project-member-response.dto';
import { ProjectPacResponseDto } from './project-pac-response.dto';

export class ProjectResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  ownerUserId: string;

  @ApiProperty({ example: 'Mi Startup', minLength: 1 })
  projectName: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  projectImageUrl: string | null;

  @ApiProperty({ enum: ProjectStatus })
  status: ProjectStatus;

  @ApiPropertyOptional({ type: String, nullable: true })
  country: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  industry: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  tagline: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  shortDescription: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, format: 'uri' })
  startupLinkedinUrl: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, format: 'uri' })
  websiteUrl: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, format: 'uri' })
  rlabProfileUrl: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  openedAt: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  closedAt: Date | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  closeReason: string | null;

  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true })
  currentTramoId: string | null;

  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true })
  currentPacId: string | null;

  @ApiPropertyOptional({ enum: TrajectoryStatus, nullable: true })
  trajectoryStatus: TrajectoryStatus | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  nftImageUrl: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  lastActivityAt: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: UserResponseDto })
  owner?: UserResponseDto;

  @ApiPropertyOptional({ type: ProjectProfileResponseDto, nullable: true })
  profile?: ProjectProfileResponseDto | null;

  @ApiPropertyOptional({ type: [ProjectMemberResponseDto] })
  members?: ProjectMemberResponseDto[];

  @ApiPropertyOptional({ type: [ProjectPacResponseDto] })
  projectPacs?: ProjectPacResponseDto[];
}
