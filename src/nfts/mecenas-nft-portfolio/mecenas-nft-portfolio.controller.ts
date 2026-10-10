import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { CreateMecenasNftDto } from './dto/create-mecenas-nft.dto';
import { UpdateMecenasNftDto } from './dto/update-mecenas-nft.dto';
import { MecenasNftPortfolioService } from './mecenas-nft-portfolio.service';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('Mecenas NFT Portfolio')
@Controller('mecenas-nft-portfolio')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MecenasNftPortfolioController {
  constructor(private readonly mecenasNftPortfolioService: MecenasNftPortfolioService) {}

  @ApiOperation({ summary: 'Crea una nueva entrada en el portafolio de NFT del mecenas' })
  @Post()
  async createMecenasNft(@CurrentUser('id') userId: string, @Body() data: CreateMecenasNftDto) {
    return await this.mecenasNftPortfolioService.createMecenasNft({
      ...data,
      mecenasUserId: userId,
    });
  }

  @ApiOperation({ summary: 'Busca entradas en el portafolio de NFT del mecenas por su ID' })
  @Get('mecenas')
  async findByMecenasId(@CurrentUser('id') userId: string) {
    return await this.mecenasNftPortfolioService.findByMecenasId(userId);
  }

  @ApiOperation({
    summary: 'Busca entradas en el portafolio de NFT del mecenas por su ID de proyecto NFT',
  })
  @Get('nft-project/:id')
  async findByNftProjectId(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const entry = await this.mecenasNftPortfolioService.findByNftProjectId(id);
    if (user.role !== UserRole.ADMIN && entry.mecenasUserId !== user.sub) {
      throw new ForbiddenException('No tenés permiso para ver este recurso');
    }
    return entry;
  }

  @ApiOperation({ summary: 'Actualiza una entrada en el portafolio de NFT del mecenas por su ID' })
  @Patch('nft-project/:id')
  async updateMecenasNft(
    @Param('id') id: string,
    @Body() data: UpdateMecenasNftDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.mecenasNftPortfolioService.assertOwnership(id, { userId: user.sub, role: user.role });
    return await this.mecenasNftPortfolioService.updateMecenasNft(id, data, {
      userId: user.sub,
      role: user.role,
    });
  }
}