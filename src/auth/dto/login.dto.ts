import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario registrado',
    example: 'juanperez@mail.com',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'MiPass@123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
