import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * QA-001: cuerpo de POST /auth/logout.
 *
 * El logout por cookie de sesion es el flujo normal del navegador: el backend
 * lee el JWT de la cookie/Authorization y revoca la sesion (bump de
 * sessionVersion = logout global). El `refreshToken` en body es opcional y
 * existe para clientes que aun lo manejan explicitamente (compatibilidad).
 */
export class LogoutDto {
  @ApiProperty({
    description: 'Refresh token a revocar (opcional, compatibilidad).',
    required: false,
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
