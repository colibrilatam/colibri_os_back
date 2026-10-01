import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dtos/user-response.dto';

export class AuthResponseDto {
  @ApiProperty({ example: 'Usuario logueado con éxito' })
  message: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}