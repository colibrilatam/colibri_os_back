import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateNftProjectDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  chainId: number;

  @ApiProperty({ example: '0x1234...abcd' })
  @IsString()
  @IsNotEmpty()
  contractAddress: string;

  @ApiProperty({ example: '42' })
  @IsString()
  @IsNotEmpty()
  tokenId: string;

  @ApiPropertyOptional({ example: 'hash-del-nft' })
  @IsString()
  @IsOptional()
  nftHash?: string;

  @ApiPropertyOptional({ example: 'https://metadata.uri/42' })
  @IsString()
  @IsOptional()
  metadataUri?: string;

  @ApiPropertyOptional({ example: 'v1' })
  @IsString()
  @IsOptional()
  currentVisualVersion?: string;

  @ApiPropertyOptional({ example: 'uuid-del-tramo' })
  @IsUUID()
  @IsOptional()
  representedTramoId?: string;

  @ApiPropertyOptional({ example: 'uuid-del-holder' })
  @IsUUID()
  @IsOptional()
  currentHolderUserId?: string;
}