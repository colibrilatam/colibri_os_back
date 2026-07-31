// src/mecenas-semilla/mecenas-semilla.controller.ts
import { Body, Controller, Get, Param, Post, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { BuyNftsDto } from './dto/buy-nfts.dto';
import { AssignNftDto } from './dto/assign-nft.dto';
import { MecenasSemillaService } from './mecenas-semilla.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Mecenas Aliado Semilla')
@Controller('mecenas-semilla')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MecenasSemillaController {
  constructor(private readonly mecenasService: MecenasSemillaService) {}

  @Post('activate/:userId')
  // @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Activar rol de Mecenas Aliado Semilla',
    description:
      'Cambia el rol del usuario a mecenas_semilla y emite su NFT intransferible de acreditación. Falla si el usuario ya está activado.',
  })
  @ApiParam({
    name: 'userId',
    type: 'string',
    format: 'uuid',
    description: 'ID del usuario a activar como Mecenas Aliado Semilla',
  })
  @ApiResponse({ status: 200, description: 'Mecenas activado correctamente' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'El usuario ya está activado como Mecenas Aliado Semilla',
  })
  async activate(
    @Param('userId') userId: string,
    @CurrentUser() principal: { sub: string; role: UserRole },
  ) {
    return await this.mecenasService.activateMecenas(userId, principal.sub);
  }

  @Get('dashboard/:userId')
  // @Roles(UserRole.MECENAS_SEMILLA, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Obtener dashboard del mecenas',
    description:
      'Retorna el resumen del portafolio del mecenas: total de NFTs, asignados, disponibles y proyectos patrocinados.',
  })
  @ApiParam({
    name: 'userId',
    type: 'string',
    format: 'uuid',
    description: 'ID del mecenas',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard del mecenas',
    schema: {
      example: {
        totalNfts: 5,
        assignedNfts: 2,
        availableNfts: 3,
        sponsoredProjects: [],
      },
    },
  })
  async getDashboard(
    @Param('userId') userId: string,
    @CurrentUser() principal: { sub: string; role: UserRole },
  ) {
    this.assertSelfOrAdmin(userId, principal);
    return await this.mecenasService.getDashboard(userId);
  }

  @Post('buy-nfts/:userId')
  // @Roles(UserRole.MECENAS_SEMILLA, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Comprar NFTs Colibrí asignables',
    description:
      'Crea la cantidad indicada de NFTs Colibrí disponibles en el portafolio del mecenas. En el MVP la compra es simulada sin integración de pago.',
  })
  @ApiParam({
    name: 'userId',
    type: 'string',
    format: 'uuid',
    description: 'ID del mecenas que realiza la compra',
  })
  @ApiBody({ type: BuyNftsDto })
  @ApiResponse({
    status: 201,
    description: 'NFTs adquiridos correctamente',
    schema: {
      example: {
        message: '3 NFT(s) Colibrí adquiridos correctamente',
        acquired: 3,
      },
    },
  })
  async buyNfts(
    @Param('userId') userId: string,
    @Body() dto: BuyNftsDto,
    @CurrentUser() principal: { sub: string; role: UserRole },
  ) {
    this.assertSelfOrAdmin(userId, principal);
    return await this.mecenasService.buyNfts(userId, dto.quantity);
  }

  @Get('projects/:userId')
  // @Roles(UserRole.MECENAS_SEMILLA, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Explorar proyectos visibles para el mecenas',
    description:
      'Retorna dos listas: proyectos elegibles para patrocinio (sin NFT asignado) y proyectos que el mecenas ya patrocina.',
  })
  @ApiParam({
    name: 'userId',
    type: 'string',
    format: 'uuid',
    description: 'ID del mecenas',
  })
  @ApiResponse({
    status: 200,
    description: 'Proyectos visibles para el mecenas',
    schema: {
      example: {
        eligibleProjects: [],
        sponsoredProjects: [],
      },
    },
  })
  async getProjects(
    @Param('userId') userId: string,
    @CurrentUser() principal: { sub: string; role: UserRole },
  ) {
    this.assertSelfOrAdmin(userId, principal);
    return await this.mecenasService.getProjects(userId);
  }

  @Post('assign-nft/:userId')
  // @Roles(UserRole.MECENAS_SEMILLA, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Asignar NFT Colibrí a un proyecto elegible',
    description:
      'Vincula un NFT disponible del portafolio del mecenas a un proyecto elegible. Registra el evento de transferencia y actualiza el dashboard. La operación es atómica.',
  })
  @ApiParam({
    name: 'userId',
    type: 'string',
    format: 'uuid',
    description: 'ID del mecenas que realiza la asignación',
  })
  @ApiBody({ type: AssignNftDto })
  @ApiResponse({
    status: 201,
    description: 'NFT asignado al proyecto correctamente',
    schema: {
      example: {
        message: 'NFT asignado al proyecto correctamente',
      },
    },
  })
  async assignNft(
    @Param('userId') userId: string,
    @Body() dto: AssignNftDto,
    @CurrentUser() principal: { sub: string; role: UserRole },
  ) {
    this.assertSelfOrAdmin(userId, principal);
    return await this.mecenasService.assignNft(userId, dto.portfolioId, dto.projectId);
  }

  private assertSelfOrAdmin(userId: string, principal: { sub: string; role: UserRole }): void {
    if (principal.role !== UserRole.ADMIN && principal.sub !== userId) {
      throw new ForbiddenException('No tenÃ©s acceso al portafolio de otro usuario');
    }
  }
}
