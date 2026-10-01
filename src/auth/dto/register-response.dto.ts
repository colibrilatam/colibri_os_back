import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dtos/user-response.dto';

export class RegisterResponseDto {
  @ApiProperty({ example: 'Usuario registrado con éxito' })
  message: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}