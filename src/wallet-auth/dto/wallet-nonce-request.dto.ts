import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsInt, Min } from 'class-validator';

export class WalletNonceRequestDto {
  @ApiProperty({
    description: 'Dirección Ethereum de la wallet (checksum)',
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38',
  })
  @IsEthereumAddress()
  walletAddress: string;

  @ApiProperty({
    description: 'Chain ID de la red',
    example: 1,
  })
  @IsInt()
  @Min(1)
  chainId: number;
}
