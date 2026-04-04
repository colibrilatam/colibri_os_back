// src/mecenas-semilla/mecenas-semilla.controller.ts
import {
    Body,
    Controller,
    Get,
    Param,
    Post,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiParam,
    ApiBody,
    ApiResponse,
} from '@nestjs/swagger';
import { BuyNftsDto } from './dto/buy-nfts.dto';
import { AssignNftDto } from './dto/assign-nft.dto';
import { MecenasSemillaService } from './mecenas-semilla.service';

@ApiTags('Mecenas Aliado Semilla')
@Controller('mecenas-semilla')
export class MecenasSemillaController {
    constructor(private readonly mecenasService: MecenasSemillaService) { }

    @Post('activate/:userId')
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
    @ApiResponse({ status: 409, description: 'El usuario ya está activado como Mecenas Aliado Semilla' })
   async activate(@Param('userId') userId: string) {
        return await this.mecenasService.activateMecenas(userId);
    }

    @Get('dashboard/:userId')
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
    async getDashboard(@Param('userId') userId: string) {
        return await this.mecenasService.getDashboard(userId);
    }

    @Post('buy-nfts/:userId')
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
    async buyNfts(@Param('userId') userId: string, @Body() dto: BuyNftsDto) {
        return await this.mecenasService.buyNfts(userId, dto.quantity);
    }

    @Get('projects/:userId')
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
    async getProjects(@Param('userId') userId: string) {
        return await this.mecenasService.getProjects(userId);
    }

    @Post('assign-nft/:userId')
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
    async assignNft(@Param('userId') userId: string, @Body() dto: AssignNftDto) {
        return await this.mecenasService.assignNft(userId, dto.portfolioId, dto.projectId);
    }
}