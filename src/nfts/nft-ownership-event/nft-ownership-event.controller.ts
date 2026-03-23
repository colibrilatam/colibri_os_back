import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { NftOwnershipEventService } from "./nft-ownership-event.service";
import { CreateNftOwnershipDto } from "./dto/create-nft-ownership.dto";
import { JwtAuthGuard } from "src/auth/guards/auth.guard";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags('NFT Ownership Events')
@Controller('nft-ownership-events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NftOwnershipEventController {
    constructor(private readonly nftOwnershipEventService: NftOwnershipEventService){}

    @ApiOperation({ summary: 'Registrar un nuevo evento de propiedad de NFT' })
    @Post()
    async create(@Body() data: CreateNftOwnershipDto){
        return await this.nftOwnershipEventService.create(data);
    }

    @ApiOperation({ summary: 'Buscar eventos de propiedad por ID de proyecto NFT' })
    @Get('by-nft-project/:nftProjectId')
    async findByNftProjectId(@Param('nftProjectId') nftProjectId: string){
        return await this.nftOwnershipEventService.findByNftProjectId(nftProjectId);
    }

    @ApiOperation({ summary: 'Buscar eventos de propiedad por ID de usuario' })
    @Get('by-user/:userId')
    async findByUserId(@Param('userId') userId: string){
        return await this.nftOwnershipEventService.findByUserId(userId);
    }
}