import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dtos/user-response.dto';

export class CompleteProfileResponseDto {
  @ApiProperty({ example: 'Perfil completado con éxito' })
  message: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}