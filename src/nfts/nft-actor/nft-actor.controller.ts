import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/auth.guard";
import { NftActorService } from "./nft-actor.service";
import { CreateNftActorDto } from "./dto/create-nft-actor.dto";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UpdateNftActorDto } from "./dto/update-nft-actor.dto";

@ApiTags('NFT Actor')
@Controller('nft-actor')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NftActorController {
    constructor (private readonly nftActorService: NftActorService) {}

    @ApiOperation({summary: 'Crear un NFT Actor'})
    @Post()
    async createNftActor(@Req() req: any ,@Body() nftActor: CreateNftActorDto){
        const userId = req.user.sub
        return await this.nftActorService.createNftActor({...nftActor, userId});
    }

    @ApiOperation({summary: 'Obtener un NFT Actor por ID del usuario'})
    @Get('user')
    async findByUserId(@Req() req: any){
        const userId = req.user.sub
        return await this.nftActorService.findByUserId(userId);
    }

    @ApiOperation({summary: 'Obtener un NFT Actor por ID'})
    @Get(':id')
    async findById(@Param('id') id: string){
        return await this.nftActorService.findById(id);
    }

    @ApiOperation({summary: 'Actualizar un NFT Actor'})
    @Patch(':id')
    async updateNftActor(@Param('id') id: string, @Body() data: UpdateNftActorDto){
        return await this.nftActorService.updateNftActor(id, data);
    }
}