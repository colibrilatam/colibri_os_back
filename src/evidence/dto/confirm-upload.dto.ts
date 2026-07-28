import { IsUUID, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConfirmUploadDto {
  @ApiProperty({ description: 'UUID de la evidencia a confirmar', example: 'ev-uuid-0001' })
  @IsUUID()
  evidenceId: string;

  @ApiProperty({
    description: 'Public ID exacto autorizado por la sesión de carga',
    example: 'colibri/evidences/project_abcd1234/ev_efgh5678_1712000000',
  })
  @IsString()
  cloudinaryPublicId: string;

  @ApiPropertyOptional({
    description: 'Descripción breve de los cambios respecto a la versión anterior',
    example: 'Corrección de formato solicitada por el evaluador.',
  })
  @IsOptional()
  @IsString()
  changeSummary?: string;

  @ApiPropertyOptional({
    description: 'Si es true, este upload reemplaza sustancialmente la evidencia anterior',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isMaterialChange?: boolean;
}
