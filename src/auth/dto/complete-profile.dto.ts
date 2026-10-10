import { IsEnum, IsIn, IsNotEmpty, IsString } from 'class-validator';
import { Gender } from '../../users/entities/user.entity';
import { UserRole } from '../../users/entities/user.entity';
import { ALLOWED_SELF_ASSIGN_ROLES } from '../allowed-roles';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteProfileDto {
  /**
   * SEC-002 / B1: antes aceptaba `@IsEnum(UserRole)` completo, lo que permitiria
   * a un usuario OAuth auto-asignarse `admin` (o `demo_readonly`) en un endpoint
   * publico. Ahora usa la misma whitelist que el registro.
   */
  @ApiProperty({
    enum: ALLOWED_SELF_ASSIGN_ROLES as unknown as UserRole[],
    description:
      'Rol con el que se completa el perfil. Solo se permiten roles no privilegiados.',
    example: UserRole.ENTREPRENEUR,
  })
  @IsIn(ALLOWED_SELF_ASSIGN_ROLES, {
    message: `role debe ser uno de: ${ALLOWED_SELF_ASSIGN_ROLES.join(', ')}`,
  })
  role: UserRole;

  @IsEnum(Gender)
  gender: Gender;

  @IsString()
  @IsNotEmpty()
  profileCompletionToken: string;
}