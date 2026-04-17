import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MicroActionType,
  EvidenceType,
} from '../entities/micro-action-definition.entity';

export class CreateMicroActionDefinitionDto {
  @ApiProperty({
    description: 'UUID del PAC al que pertenece esta microacción',
    example: 'a1b2c3d4-0001-4aaa-8bbb-ccccdddd0001',
  })
  @IsUUID()
  @IsNotEmpty()
  pacId: string;

  @ApiPropertyOptional({
    description: 'UUID de la rúbrica asociada para evaluación (opcional)',
    example: 'f1e2d3c4-0002-4bbb-9ccc-eeeeffff0002',
  })
  @IsUUID()
  @IsOptional()
  rubricId?: string;

  @ApiProperty({
    description: 'Código único identificador de la microacción',
    example: 'MA-T1-P1-001',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Instrucción que el emprendedor debe seguir para ejecutar la microacción',
    example: 'Realizá al menos 5 entrevistas de descubrimiento con potenciales usuarios y documentá los hallazgos clave.',
  })
  @IsString()
  @IsNotEmpty()
  instruction: string;

  @ApiProperty({
    description: 'Orden de aparición dentro del PAC (1, 2, 3...)',
    example: 1,
  })
  @IsInt()
  sortOrder: number;

  @ApiPropertyOptional({
    description: 'Ventana de tiempo en días para completar la microacción',
    example: 7,
  })
  @IsInt()
  @IsOptional()
  executionWindowDays?: number;

  @ApiPropertyOptional({
    description: 'Tipo de microacción según su naturaleza',
    enum: MicroActionType,
    example: MicroActionType.INTERVIEW,
  })
  @IsEnum(MicroActionType)
  @IsOptional()
  microActionType?: MicroActionType;

  @ApiPropertyOptional({
    description: 'Si es true, esta microacción es obligatoria para completar el PAC',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Si es true, la microacción puede reutilizarse en otros PACs',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isReusable?: boolean;

  @ApiPropertyOptional({
    description: 'Si es true, el emprendedor debe adjuntar evidencia para completar la microacción',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  evidenceRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Tipo de evidencia esperada para esta microacción',
    enum: EvidenceType,
    example: EvidenceType.FILE,
  })
  @IsEnum(EvidenceType)
  @IsOptional()
  expectedEvidenceType?: EvidenceType;

  @ApiPropertyOptional({
    description: 'Peso de esta microacción en la dimensión de consistencia del IC (0.00 a 100.00)',
    example: 0.33,
  })
  @IsNumber()
  @IsOptional()
  consistencyWeight?: number;

  @ApiPropertyOptional({
    description: 'Peso de esta microacción en la dimensión de colaboración del IC (0.00 a 100.00)',
    example: 0.33,
  })
  @IsNumber()
  @IsOptional()
  collaborationWeight?: number;

  @ApiPropertyOptional({
    description: 'Peso de esta microacción en la dimensión de sostenibilidad del IC (0.00 a 100.00)',
    example: 0.34,
  })
  @IsNumber()
  @IsOptional()
  sustainabilityWeight?: number;

  @ApiPropertyOptional({
    description: 'Fecha desde la cual esta microacción está vigente',
    example: '2024-01-01',
  })
  @IsDateString()
  @IsOptional()
  validFrom?: Date;

  @ApiPropertyOptional({
    description: 'Fecha hasta la cual esta microacción está vigente (null = sin vencimiento)',
    example: '2025-12-31',
  })
  @IsDateString()
  @IsOptional()
  validTo?: Date;
}