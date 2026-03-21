import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString } from "class-validator";

export class UpdateUserDto {
    @ApiProperty({
        description: 'Correo electrónico del usuario (único)',
        example: 'juanperez@mail.com',
    })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({
        description: 'Nombre completo del usuario',
        example: 'Juan Perez'
    })
    @IsOptional()
    @IsString()
    fullName?: string;

    @ApiProperty({
        description: 'ID de LinkedIn del usuario',
        example: 'https://www.linkedin.com/in/juanperez'
    })
    @IsOptional()
    @IsString()
    linkedinId?: string;

    @ApiProperty({
        description: 'Dirección de billetera cripto del usuario',
        example: '0x1234567890abcdef'
    })
    @IsOptional()
    @IsString()
    cryptoWallet?: string;

    @ApiProperty({
        description: 'Dirección de billetera de credenciales del usuario',
        example: '0x1234567890abcdef'
    })
    @IsOptional()
    @IsString()
    credentialsWallet?: string;

    @ApiProperty({
        description: 'Hash del ADN del usuario',
        example: '0x1234567890abcdef'
    })
    @IsOptional()
    @IsString()
    adnHash?: string;

    @ApiProperty({
        description: 'Biografía del usuario',
        example: ' Ingeniero de software con 5 años de experiencia'
    })
    @IsOptional()
    @IsString()
    bio?: string;

    @ApiProperty({
        description: 'URL del avatar del usuario',
        example: 'https://www.example.com/avatar.jpg'
    })
    @IsOptional()
    @IsString()
    avatar?: string;
}