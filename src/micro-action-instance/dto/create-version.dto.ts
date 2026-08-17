import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateVersionDto {
  @ApiPropertyOptional({
    description: 'Notas de ejecución de esta versión',
    example: 'Subí el avance del prototipo.',
  })
  @IsOptional()
  @IsString()
  executionNotes?: string;
}
