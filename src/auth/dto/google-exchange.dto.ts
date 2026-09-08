import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class GoogleExchangeDto {
  @ApiProperty({
    description: 'Código de un solo uso recibido en /login/google-callback?code=...',
    example: 'a1b2c3...',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 256)
  code: string;
}