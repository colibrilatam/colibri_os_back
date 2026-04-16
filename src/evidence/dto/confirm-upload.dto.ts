import { IsUUID, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConfirmUploadDto {
  @ApiProperty({ description: 'UUID de la evidencia a confirmar', example: 'ev-uuid-0001' })
  @IsUUID()
  evidenceId: string;

  @ApiProperty({ description: 'Public ID devuelto por Cloudinary tras el upload', example: 'colibri/evidences/ev-uuid-0001/archivo' })
  @IsString()
  cloudinaryPublicId: string;

  @ApiProperty({ description: 'URL segura devuelta por Cloudinary (secure_url)', example: 'https://res.cloudinary.com/colibri/image/upload/v1/evidences/ev-uuid-0001/archivo.pdf' })
  @IsString()
  storageUri: string;

  @ApiProperty({ description: 'MIME type del archivo subido — necesario para determinar el resourceType', example: 'application/pdf' })
  @IsString()
  mimeType: string;

  @ApiPropertyOptional({ description: 'Descripción breve de los cambios respecto a la versión anterior', example: 'Corrección de formato solicitada por el evaluador.' })
  @IsOptional() @IsString()
  changeSummary?: string;

  @ApiPropertyOptional({ description: 'Si es true, este upload reemplaza sustancialmente la evidencia anterior', example: false, default: false })
  @IsOptional() @IsBoolean()
  isMaterialChange?: boolean;
}