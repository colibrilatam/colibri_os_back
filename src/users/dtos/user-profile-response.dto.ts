import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

/**
 * Respuesta de `GET /users/profile`.
 *
 * Es el único endpoint que devuelve los permisos efectivos del rol; el resto
 * de los endpoints que devuelven `UserResponseDto` (signin/signup, GET
 * /users/:id, listados) no los incluyen, por eso el schema separado.
 */
export class UserProfileResponseDto extends UserResponseDto {
  @ApiProperty({
    type: [String],
    description: 'Permisos efectivos derivados del rol del usuario autenticado.',
    example: ['catalog:read', 'project:read:own', 'project:manage:own'],
  })
  permissions: string[];
}
