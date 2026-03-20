import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Length,
} from 'class-validator';

export class CreateUserDto {

  @ApiProperty({
    description: 'Correo electrónico del usuario (único)',
    example: 'juanperez@mail.com',
  })
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario (debe ser fuerte)',
    example: 'MiPass@123',
  })
  @IsString()
  @Length(3, 15)
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;

  @ApiProperty({
    description: 'Confirmación de la contraseña',
    example: 'MiPass@123',
  })
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;

  @ApiProperty({ 
    description: 'Nombre completo del usuario', 
    example: 'Juan Perez' })
  @IsString()
  @IsNotEmpty()
   fullName: string;

}