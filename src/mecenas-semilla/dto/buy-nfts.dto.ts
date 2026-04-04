// buy-nfts.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class BuyNftsDto {
  @ApiProperty({
    description: 'Cantidad de NFTs Colibrí a adquirir',
    minimum: 1,
    example: 3,
  })
  @IsInt()
  @Min(1)
  quantity: number;
}