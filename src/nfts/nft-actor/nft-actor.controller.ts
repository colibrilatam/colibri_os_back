import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { NftActorService } from './nft-actor.service';
import { CreateNftActorDto } from './dto/create-nft-actor.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateNftActorDto } from './dto/update-nft-actor.dto';
import { UserRole } from '../../users/entities/user.entity';

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
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const nftActor = await this.nftActorService.findById(id);
    if (user.role !== UserRole.ADMIN && nftActor.userId !== user.sub) {
      throw new ForbiddenException('No tenés permiso para ver este recurso');
    }
    return nftActor;
  }

  @ApiOperation({ summary: 'Actualizar un NFT Actor' })
  @Patch(':id')
  async updateNftActor(
    @Param('id') id: string,
    @Body() data: UpdateNftActorDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.nftActorService.assertOwnership(id, { userId: user.sub, role: user.role });
    return await this.nftActorService.updateNftActor(id, data, {
      userId: user.sub,
      role: user.role,
    });
  }
}