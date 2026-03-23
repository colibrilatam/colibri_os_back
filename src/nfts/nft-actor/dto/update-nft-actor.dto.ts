import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";

export class UpdateNftActorDto {
    @ApiProperty({ description: 'Fecha del minteo del NFT, opcional', example: '2024-01-01T00:00:00Z' })
    @IsOptional()
    @IsDateString()
    mintedAt?: Date;

    @ApiProperty({ description: 'URI de los metadatos del NFT, opcional', example: 'https://example.com/metadata.json' })
    @IsOptional()
    @IsString()
    metadataUri?: string;

    @ApiProperty({ description: 'Hash del NFT, opcional', example: '0x1234567890abcdef' })
    @IsOptional()
    @IsString()
    nftHash?: string;
}