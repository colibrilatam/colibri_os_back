import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class AssignNftDto {
  @ApiProperty({
    description:
      'ID del registro de portafolio (NFT disponible del mecenas)',
    format: 'uuid',
  })
  @IsUUID()
  portfolioId: string;

  @ApiProperty({
    description:
      'ID del proyecto elegible receptor del NFT',
    format: 'uuid',
  })
  @IsUUID()
  projectId: string;

  @ApiProperty({
    description:
      'Hash de la transacción que realizó la transferencia on-chain del NFT',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{64}$/)
  txHash: string;
}