import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEthereumAddress, IsInt, Min } from 'class-validator';
import { ethers } from 'ethers';

function toChecksumAddress(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return ethers.getAddress(value);
  } catch {
    return value;
  }
}

export class WalletNonceRequestDto {
  @ApiProperty({
    description: 'Dirección Ethereum de la wallet (se normaliza a checksum EIP-55)',
    example: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38',
  })
  @Transform(({ value }) => toChecksumAddress(value))
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
