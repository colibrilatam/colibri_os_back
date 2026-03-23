import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { NftEventType } from "src/nfts/entities/nft-ownership-event.entity";

export class CreateNftOwnershipDto {
    @ApiProperty({ description: 'ID del proyecto NFT asociado', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsString()
    nftProjectId: string;
    
    @ApiProperty({ description: 'ID del usuario que transfiere el NFT', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsOptional()
    @IsString()
    fromUserId?: string;
    
    @ApiProperty({ description: 'ID del usuario que recibe el NFT', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsOptional()
    @IsString()
    toUserId?: string;

    @ApiProperty({ description: 'Tipo de evento de propiedad', enum: NftEventType, example: NftEventType.TRANSFER })
    @IsEnum(NftEventType)
    eventType: NftEventType;

    @ApiProperty({ description: 'Hash de la transacción en la blockchain (si aplica)', example: '0xabc123...' })
    @IsOptional()
    @IsString()
    txHash?: string;

    @ApiProperty({ description: 'Fecha y hora en que ocurrió el evento', example: '2024-06-01T12:00:00Z' })
    @IsDateString()
    occurredAt: Date;
}