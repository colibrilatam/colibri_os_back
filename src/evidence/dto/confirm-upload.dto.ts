import { IsUUID, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConfirmUploadDto {
  @ApiProperty({ description: 'UUID de la evidencia a confirmar', example: 'ev-uuid-0001' })
  @IsUUID()
  evidenceId: string;

  @ApiProperty({
    description:
      'ID de la sesión de carga devuelta por request-upload-signature. Es de un solo uso.',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID()
  uploadSessionId: string;

  @ApiProperty({
    description: 'Public ID exacto autorizado por la sesión de carga',
    example: 'colibri/evidences/project_abcd1234/ev_efgh5678_1712000000.pdf',
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