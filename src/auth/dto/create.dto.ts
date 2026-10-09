import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, Length, IsOptional, IsIn } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class CreateUserDto {
  @ApiProperty({
    description: 'Correo electrónico del usuario (único)',
    example: 'juanperez@mail.com',
    format: 'email'
  })
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario (debe ser fuerte)',
    example: 'MiPass@123',
    minLength: 8, maxLength: 15
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
    example: 'Juan Perez',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    enum: [UserRole.ENTREPRENEUR, UserRole.EVALUATOR],
    description:
      'Rol con el que se registra el usuario. Solo se permiten roles no privilegiados. Default: entrepreneur.',
    example: UserRole.ENTREPRENEUR,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsIn([UserRole.ENTREPRENEUR, UserRole.EVALUATOR], {
    message: `role debe ser uno de: ${UserRole.ENTREPRENEUR}, ${UserRole.EVALUATOR}`,
  })
  role?: UserRole;
}
