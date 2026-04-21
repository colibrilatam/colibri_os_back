// src/tramo-closure/dto/evaluate-closure.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class EvaluateClosureDto {
  @ApiProperty({ description: 'Proyecto a evaluar' })
  @IsUUID()
  projectId: string;

  @ApiProperty({ description: 'Tramo a evaluar' })
  @IsUUID()
  tramoId: string;
}