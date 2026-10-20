import { ApiProperty } from '@nestjs/swagger';

export class WalletNonceResponseDto {
  @ApiProperty({
    description: 'Mensaje SIWE para firmar',
    example: 'colibri.app wants you to sign in...',
  })
  message: string;

  @ApiProperty({
    description: 'Nonce generado (para referencia, el frontend no necesita usarlo directamente)',
    example: '0xabc123...',
  })
  nonce: string;
}
