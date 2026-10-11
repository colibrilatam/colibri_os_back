import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PacResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  categoryId: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  title_es: string;

  @ApiProperty()
  title_en: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  objectiveLine_es: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  objectiveLine_en: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  description: string | null;

  @ApiProperty()
  sortOrder: number;

  @ApiPropertyOptional({ type: Number, nullable: true })
  executionWindowDays: number | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  minimumCompletionThreshold: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  icWeight: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  closureRule: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  templateVersion: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  validFrom: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  validTo: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
