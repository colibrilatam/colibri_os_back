import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { NftEventType } from 'src/nfts/entities/nft-ownership-event.entity';

export class CreateNftOwnershipDto {
  @ApiProperty({
    description: 'ID del proyecto NFT asociado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  nftProjectId: string;

  @ApiProperty({
    description:
      'ID del usuario cuyo wallet debe coincidir con el from on-chain',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  fromUserId?: string;

  @ApiProperty({
    description:
      'ID del usuario cuyo wallet debe coincidir con el to on-chain',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  toUserId?: string;

  @ApiProperty({
    description: 'Tipo de evento de propiedad',
    enum: NftEventType,
    example: NftEventType.TRANSFER,
  })
  @IsEnum(NftEventType)
  eventType: NftEventType;

  @ApiProperty({
    description:
      'Hash real de la transacción. La fecha, bloque, from, to y tokenId se reconstruyen desde RPC.',
    example:
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  })
  @IsString()
  @Matches(/^0x[a-fA-F0-9]{64}$/, {
    message: 'txHash debe ser un hash EVM válido de 32 bytes',
  })
  txHash: string;
}