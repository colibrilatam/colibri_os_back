import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PortfolioRole } from "src/nfts/entities/mecenas-nft-portfolio.entity";

export class CreateMecenasNftDto {
    @ApiProperty({ description: 'ID del proyecto de NFT', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsString()
    nftProjectId: string;

    @ApiProperty({ description: 'ID del proyecto objetivo', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsOptional()
    @IsString()
    targetProjectId?: string;

    @ApiProperty({ description: 'Rol del mecenas en el portafolio', example: PortfolioRole.GUARDIAN })
    @IsEnum(PortfolioRole)
    portfolioRole: PortfolioRole
}