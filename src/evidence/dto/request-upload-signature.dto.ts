import { IsString, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EvidenceType } from '../../micro-action-definitions/entities/micro-action-definition.entity';

export class RequestUploadSignatureDto {
  @ApiProperty({ description: 'UUID de la evidencia previamente creada para la que se solicita la firma', example: 'ev-uuid-0001' })
  @IsUUID()
  evidenceId: string;

  @ApiProperty({ description: 'MIME type del archivo a subir', example: 'application/pdf' })
  @IsString()
  mimeType: string;

  @ApiProperty({ description: 'Tipo de evidencia — determina la carpeta destino en Cloudinary', enum: EvidenceType, example: EvidenceType.FILE })
  @IsEnum(EvidenceType)
  evidenceType: EvidenceType;
}