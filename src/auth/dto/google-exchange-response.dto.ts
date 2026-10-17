import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dtos/user-response.dto';

export class GoogleExchangeResponseDto {
  @ApiProperty({ example: 'Sesión iniciada con éxito' })
  message: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty()
  requiresProfileCompletion: boolean;

  @ApiPropertyOptional({
    description:
      'Solo presente cuando requiresProfileCompletion=true. Usar solo en memoria, nunca persistir.',
  })
  profileCompletionToken?: string;
}