import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { CreateMecenasNftDto } from "./dto/create-mecenas-nft.dto";
import { UpdateMecenasNftDto } from "./dto/update-mecenas-nft.dto";
import { MecenasNftPortfolioService } from "./mecenas-nft-portfolio.service";
import { JwtAuthGuard } from "src/auth/guards/auth.guard";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags('Mecenas NFT Portfolio')
@Controller('mecenas-nft-portfolio')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MecenasNftPortfolioController {
    constructor(private readonly mecenasNftPortfolioService: MecenasNftPortfolioService) { }
    
    @ApiOperation({ summary: 'Crea una nueva entrada en el portafolio de NFT del mecenas' })
    @Post()
    async createMecenasNft(@Req() req: any, @Body() data: CreateMecenasNftDto) {
        const userId = await req.user.sub as string;
        return await this.mecenasNftPortfolioService.createMecenasNft({...data, mecenasUserId: userId})
    }

    @ApiOperation({ summary: 'Busca entradas en el portafolio de NFT del mecenas por su ID' })
    @Get('mecenas')
    async findByMecenasId(@Req() req: any) {
        const userId = await req.user.sub as string;
        return await this.mecenasNftPortfolioService.findByMecenasId(userId);
    }

    @ApiOperation({ summary: 'Busca entradas en el portafolio de NFT del mecenas por su ID de proyecto NFT' })
    @Get('nft-project/:id')
    async findByNftProjectId(@Param('id') id: string) {
        return await this.mecenasNftPortfolioService.findByNftProjectId(id);
    }

    @ApiOperation({ summary: 'Actualiza una entrada en el portafolio de NFT del mecenas por su ID' })
    @Patch('nft-project/:id')
    async updateMecenasNft(@Param('id') id: string, @Body() data: UpdateMecenasNftDto) {
        return await this.mecenasNftPortfolioService.updateMecenasNft(id, data);
    }
}