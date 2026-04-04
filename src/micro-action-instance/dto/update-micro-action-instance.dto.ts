// src/micro-action-instance/dto/update-micro-action-instance.dto.ts

import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MicroActionInstanceStatus } from '../entities/micro-action-instance.entity';

export class UpdateMicroActionInstanceDto {
  @IsOptional()
  @IsEnum(MicroActionInstanceStatus)
  status?: MicroActionInstanceStatus;

  @IsOptional()
  @IsString()
  executionNotes?: string;
}