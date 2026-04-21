// src/reputation/dto/create-algorithm-version.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateAlgorithmVersionDto {
  @ApiProperty() @IsString() code: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiProperty() @IsNumber() weightAction: number;
  @ApiProperty() @IsNumber() weightEvidence: number;
  @ApiProperty() @IsNumber() weightConsistency: number;
  @ApiProperty() @IsNumber() weightCollaboration: number;
  @ApiProperty() @IsNumber() weightSustainability: number;
  @ApiPropertyOptional() @IsOptional() consistencyFormulaJson?: object;
  @ApiPropertyOptional() @IsOptional() collaborationFormulaJson?: object;
  @ApiPropertyOptional() @IsString() @IsOptional() sustainabilityRubricVersion?: string;
  @ApiProperty() @IsString() effectiveFrom: string;
  @ApiPropertyOptional() @IsString() @IsOptional() effectiveTo?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() isActive?: boolean;
  @ApiPropertyOptional() @IsString() @IsOptional() approvedBy?: string;
}