import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { PortfolioRole } from "src/nfts/entities/mecenas-nft-portfolio.entity";

export class UpdateMecenasNftDto{

    @ApiProperty({ description: 'ID del proyecto objetivo', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsOptional()
    @IsString()
    targetProjectId?: string;

    @ApiProperty({ description: 'Rol del mecenas en el portafolio', example: PortfolioRole.GUARDIAN })
    @IsOptional()
    @IsEnum(PortfolioRole)
    portfolioRole?: PortfolioRole;

    @ApiProperty({ description: 'Fecha de liberación', example: '2023-01-01T00:00:00.000Z' })
    @IsOptional()
    @IsDateString()
    releasedAt?: Date;
}