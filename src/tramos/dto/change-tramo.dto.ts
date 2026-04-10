// src/tramos/dto/change-tramo.dto.ts

import { IsUUID, IsOptional, IsString } from 'class-validator';

export class ChangeTramoDto {
  @IsUUID()
  newTramoId: string;

  @IsOptional()
  @IsString()
  changeReason?: string;
}