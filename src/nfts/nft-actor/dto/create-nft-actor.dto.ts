import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { ActorNftType } from "../../entities/nft-actor.entity";
import { ApiProperty } from "@nestjs/swagger";

export class CreateNftActorDto {
    @ApiProperty({ description: 'Tipo de NFT del actor', example: 'mentor' })
    @IsEnum(ActorNftType)
    actorNftType: ActorNftType;
    
    @ApiProperty({ description: 'Número estándar que identifica cada red blockchain', example: 1 })
    @IsNumber()
    chainId: number;
    
    @ApiProperty({ description: 'Dirección del contrato', example: '0x1234567890123456789012345678901234567890' })
    @IsString()
    contractAddress: string;

    @ApiProperty({ description: 'Identificador del NFT dentro de ese contrato.', example: '1' })
    @IsString()
    tokenId: string;

    @ApiProperty({ description: 'Hash del NFT huella única que identifica al NFT en el sistema de Colibrí, opcional', example: 'QmXoYpZ...' })
    @IsOptional()
    @IsString()
    nftHash?: string;

    @ApiProperty({ description: 'URI de los metadatos del NFT', example: 'https://example.com/metadata/1' })
    @IsOptional()
    @IsString()
    metadataUri?: string;
}