// src/micro-action-instance/dto/create-micro-action-instance.dto.ts

import { IsUUID, IsOptional, IsInt, IsString, Min } from 'class-validator';

export class CreateMicroActionInstanceDto {
  @IsUUID()
  projectId: string;

  @IsUUID()
  microActionDefinitionId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  executionWindowDaysSnapshot?: number;

  @IsOptional()
  @IsString()
  executionNotes?: string;
}