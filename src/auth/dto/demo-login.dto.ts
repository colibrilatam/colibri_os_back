import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

/**
 * SEC-002 / PR-BE3: cuerpo de POST /auth/demo-login.
 *
 * El campo `role` no es un rol de autorizacion: es un selector de persona
 * demo. Elige cual de las cuentas demo (sembradas por PR-BE4) se usa.
 * El token SIEMPRE se firma con role='demo_readonly' (el rol real de la
 * cuenta en la DB), sin importar el valor elegido aqui.
 */
export class DemoLoginDto {
  @ApiProperty({
    enum: ['entrepreneur', 'mentor', 'evaluator', 'mecenas_semilla'],
    description:
      'Persona demo a usar. El token emitido SIEMPRE lleva role=demo_readonly.',
    example: 'entrepreneur',
    required: false,
    default: 'entrepreneur',
  })
  @IsOptional()
  @IsIn(['entrepreneur', 'mentor', 'evaluator', 'mecenas_semilla'], {
    message: 'role debe ser uno de: entrepreneur, mentor, evaluator, mecenas_semilla',
  })
  role?: 'entrepreneur' | 'mentor' | 'evaluator' | 'mecenas_semilla';
}