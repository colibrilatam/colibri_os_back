import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { NftActorService } from './nft-actor.service';
import { CreateNftActorDto } from './dto/create-nft-actor.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateNftActorDto } from './dto/update-nft-actor.dto';

@ApiTags('NFT Actor')
@Controller('nft-actor')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NftActorController {
  constructor(private readonly nftActorService: NftActorService) {}

  @ApiOperation({ summary: 'Crear un NFT Actor' })
  @Post()
  async createNftActor(@CurrentUser('id') userId: string, @Body() nftActor: CreateNftActorDto) {
    return await this.nftActorService.createNftActor({ ...nftActor, userId });
  }

  @ApiOperation({ summary: 'Obtener un NFT Actor por ID del usuario' })
  @Get('user')
  async findByUserId(@CurrentUser('id') userId: string) {
    return await this.nftActorService.findByUserId(userId);
  }

  @ApiOperation({ summary: 'Obtener un NFT Actor por ID' })
  @Get(':id')
  async findById(@Param('id') id: string) {
    return await this.nftActorService.findById(id);
  }

  @ApiOperation({ summary: 'Actualizar un NFT Actor' })
  @Patch(':id')
  async updateNftActor(@Param('id') id: string, @Body() data: UpdateNftActorDto) {
    return await this.nftActorService.updateNftActor(id, data);
  }
}
