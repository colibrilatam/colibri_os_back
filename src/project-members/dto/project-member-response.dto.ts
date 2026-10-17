import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenderProjectMember, RoleInTeam } from '../entities/project-member.entity';

export class ProjectMemberResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  projectId: string;

  @ApiPropertyOptional({ enum: GenderProjectMember, nullable: true })
  gender: GenderProjectMember | null;

  @ApiProperty({ type: String, format: 'uuid' })
  userId: string;

  @ApiProperty({ enum: RoleInTeam })
  roleInTeam: RoleInTeam;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  joinedAt: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  leftAt: Date | null;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({ type: String, nullable: true })
  participationWeight: string | null;

  @ApiProperty()
  isFounder: boolean;

  @ApiProperty()
  isPrimaryOperator: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
