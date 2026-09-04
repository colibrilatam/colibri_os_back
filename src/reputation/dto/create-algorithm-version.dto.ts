// src/reputation/dto/create-algorithm-version.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, Validate } from 'class-validator';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

const WEIGHT_SUM_TOLERANCE = 0.01;

@ValidatorConstraint({ name: 'WeightsSumTo100', async: false })
class WeightsSumTo100Constraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const dto = args.object as CreateAlgorithmVersionDto;
    const sum =
      Number(dto.weightAction) +
      Number(dto.weightEvidence) +
      Number(dto.weightConsistency) +
      Number(dto.weightCollaboration) +
      Number(dto.weightSustainability);
    return Math.abs(sum - 100) <= WEIGHT_SUM_TOLERANCE;
  }

  defaultMessage(args: ValidationArguments): string {
    const dto = args.object as CreateAlgorithmVersionDto;
    const sum =
      Number(dto.weightAction) +
      Number(dto.weightEvidence) +
      Number(dto.weightConsistency) +
      Number(dto.weightCollaboration) +
      Number(dto.weightSustainability);
    return `Los pesos deben sumar 100 (suma actual: ${sum})`;
  }
}

export class CreateAlgorithmVersionDto {
  @ApiProperty() @IsString() code: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;

  @ApiProperty() @IsNumber() weightAction: number;
  @ApiProperty() @IsNumber() weightEvidence: number;
  @ApiProperty() @IsNumber() weightConsistency: number;

  @ApiProperty({
    description:
      'Peso de colaboración. AVISO: la fuente de datos de esta dimensión aún no está ' +
      'implementada (ver REP-001) — el motor de cálculo redistribuye este peso entre las ' +
      'dimensiones con fuente válida hasta que se implemente.',
  })
  @IsNumber()
  weightCollaboration: number;

  @ApiProperty({
    description:
      'Peso de sostenibilidad. AVISO: la fuente de datos de esta dimensión aún no está ' +
      'implementada (ver REP-001) — el motor de cálculo redistribuye este peso entre las ' +
      'dimensiones con fuente válida hasta que se implemente.',
  })
  @IsNumber()
  weightSustainability: number;

  @ApiPropertyOptional() @IsOptional() consistencyFormulaJson?: object;
  @ApiPropertyOptional() @IsOptional() collaborationFormulaJson?: object;
  @ApiPropertyOptional() @IsString() @IsOptional() sustainabilityRubricVersion?: string;
  @ApiProperty() @IsString() effectiveFrom: string;
  @ApiPropertyOptional() @IsString() @IsOptional() effectiveTo?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() isActive?: boolean;
  @ApiPropertyOptional() @IsString() @IsOptional() approvedBy?: string;

  // El decorador de clase de class-validator no aplica directo sobre "this";
  // se referencia el constraint en cualquiera de los campos numéricos para
  // que corra una sola vez por objeto (patrón estándar de class-validator).
  @Validate(WeightsSumTo100Constraint)
  private readonly _weightsSumCheck?: never;
}