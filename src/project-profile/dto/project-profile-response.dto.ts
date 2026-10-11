import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProjectProfileResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  projectId: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  longDescription: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  problemStatement: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  solutionStatement: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  targetAudience: string | null;

  @ApiPropertyOptional({ type: [String], nullable: true })
  sdgGoals: string[] | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  valueProposition: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  businessModelSummary: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  stageNotes: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  pitchUrl: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
