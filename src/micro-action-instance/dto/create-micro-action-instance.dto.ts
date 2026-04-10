// src/micro-action-instance/dto/create-micro-action-instance.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsInt, IsString, Min } from 'class-validator';

export class CreateMicroActionInstanceDto {
  @ApiProperty({
    description: 'UUID del proyecto al que pertenece esta instancia',
    example: 'a3f1c2d4-1234-4abc-9def-000011112222',
  })
  @IsUUID()
  projectId: string;

  @ApiProperty({
    description: 'UUID de la definición de microacción que se está ejecutando',
    example: 'b7e2d3f5-5678-4bcd-aef0-333344445555',
  })
  @IsUUID()
  microActionDefinitionId: string;

  @ApiPropertyOptional({
    description:
      'Snapshot de la ventana de ejecución en días (copiado de la definición al momento de iniciar)',
    example: 7,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  executionWindowDaysSnapshot?: number;

  @ApiPropertyOptional({
    description: 'Notas libres del emprendedor sobre la ejecución de la microacción',
    example: 'Realicé 5 entrevistas con usuarios entre el 1 y el 5 de abril.',
  })
  @IsOptional()
  @IsString()
  executionNotes?: string;
}