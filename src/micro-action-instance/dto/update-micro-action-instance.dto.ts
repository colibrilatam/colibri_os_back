// src/micro-action-instance/dto/update-micro-action-instance.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MicroActionInstanceStatus } from '../entities/micro-action-instance.entity';

export class UpdateMicroActionInstanceDto {
  @ApiPropertyOptional({
    description:
      'Nuevo estado de la instancia. La única transición válida es: pending → completed.',
    enum: MicroActionInstanceStatus,
    example: MicroActionInstanceStatus.COMPLETED,
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

  @ApiPropertyOptional({
    description: 'Resumen opcional del motivo del cambio, se guarda en el historial de versiones',
    example: 'Corrección de notas tras feedback del mentor',
  })
  @IsOptional()
  @IsString()
  changeSummary?: string;
}
