import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { MicroActionInstanceChangeType } from '../entities/micro-action-instance-version.entity';

export class ResolveVersionDto {
  @ApiProperty({
    description: 'Nuevo estado de la versión',
    enum: [MicroActionInstanceChangeType.REJECTED, MicroActionInstanceChangeType.COMPLETED],
    example: MicroActionInstanceChangeType.REJECTED,
  })
  @IsIn([
    MicroActionInstanceChangeType.REJECTED,
    MicroActionInstanceChangeType.COMPLETED,
  ])
  status: MicroActionInstanceChangeType;

  @ApiPropertyOptional({
    description: 'Resumen del cambio. Si no se envía, se usa "No se ingresó un resumen".',
    example: 'La versión cumple con los requisitos.',
  })
  @IsOptional()
  @IsString()
  summary?: string;
}
