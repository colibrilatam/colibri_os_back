import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class WalletVerifyRequestDto {
  @ApiProperty({
    description: 'Mensaje SIWE completo que fue firmado',
    example:
      'colibri.app wants you to sign in with your Ethereum account:\n0x742d...\n\nURI: https://colibri.app\nVersion: 1\nChain ID: 1\nNonce: 0xabc...\nIssued At: 2025-01-01T00:00:00Z\nExpiration Time: 2025-01-01T00:05:00Z',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Firma hexadecimal recuperada de la wallet',
    example: '0x1234abcd...',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^0x[0-9a-fA-F]+$/, { message: 'signature must be a hex string starting with 0x' })
  signature: string;
}
