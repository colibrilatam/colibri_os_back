// src/micro-action-instance/dto/update-micro-action-instance.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MicroActionInstanceStatus } from '../entities/micro-action-instance.entity';

export class UpdateMicroActionInstanceDto {
  @ApiPropertyOptional({
    description: 'Nuevo estado de la instancia. Las transiciones válidas son: started → in_progress | submitted; in_progress → submitted; reopened → in_progress | submitted.',
    enum: MicroActionInstanceStatus,
    example: MicroActionInstanceStatus.IN_PROGRESS,
  })
  @IsOptional()
  @IsEnum(MicroActionInstanceStatus)
  status?: MicroActionInstanceStatus;

  @ApiPropertyOptional({
    description: 'Notas actualizadas del emprendedor sobre la ejecución',
    example: 'Agregué los resultados del prototipo después de la segunda iteración.',
  })
  @IsOptional()
  @IsString()
  executionNotes?: string;
}