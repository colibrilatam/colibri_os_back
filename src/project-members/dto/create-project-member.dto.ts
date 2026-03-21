import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { RoleInTeam } from '../entities/project-member.entity';

export class CreateProjectMemberDto {
  @ApiProperty({ example: 'uuid-del-usuario' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({ enum: RoleInTeam })
  @IsEnum(RoleInTeam)
  @IsOptional()
  roleInTeam?: RoleInTeam;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isFounder?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isPrimaryOperator?: boolean;

  @ApiPropertyOptional({ example: 0.5 })
  @IsNumber()
  @IsOptional()
  participationWeight?: number;
}