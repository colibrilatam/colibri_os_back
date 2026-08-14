import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { NftOwnershipEventService } from './nft-ownership-event.service';
import { CreateNftOwnershipDto } from './dto/create-nft-ownership.dto';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';

@ApiTags('NFT Ownership Events')
@Controller('nft-ownership-events')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NftOwnershipEventController {
  constructor(
    private readonly nftOwnershipEventService: NftOwnershipEventService,
  ) {}

  @ApiOperation({
    summary:
      'Registrar un evento de propiedad respaldado por blockchain',
    description:
      'El txHash es verificado contra RPC. ChainId, contrato, receipt, bloque, timestamp, from, to y tokenId se reconstruyen desde la blockchain.',
  })
  @Post()
  async create(
    @Body() data: CreateNftOwnershipDto,
  ) {
    return this.nftOwnershipEventService.create(data);
  }

  @ApiOperation({
    summary:
      'Buscar eventos de propiedad por ID de proyecto NFT',
  })
  @Get('by-nft-project/:nftProjectId')
  async findByNftProjectId(
    @Param('nftProjectId') nftProjectId: string,
  ) {
    return this.nftOwnershipEventService.findByNftProjectId(
      nftProjectId,
    );
  }

  @ApiOperation({
    summary:
      'Buscar eventos de propiedad por ID de usuario',
  })
  @Get('by-user/:userId')
  async findByUserId(
    @Param('userId') userId: string,
  ) {
    return this.nftOwnershipEventService.findByUserId(
      userId,
    );
  }

  @ApiOperation({
    summary:
      'Reconciliar manualmente una prueba blockchain',
    description:
      'Vuelve a consultar la transacción y actualiza su estado, bloque, confirmaciones y actores.',
  })
  @Post(':id/reconcile')
  @Roles(UserRole.ADMIN)
  async reconcile(
    @Param('id') id: string,
  ) {
    return this.nftOwnershipEventService.reconcileEvent(
      id,
    );
  }
}