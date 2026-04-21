import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NftProjectService } from './nfts-project.service';
import { CreateNftProjectDto } from './dto/create-nft-project.dto';
import { UpdateNftProjectDto } from './dto/update-nft-project.dto';


@ApiTags('NFT Projects')
@Controller('nft-projects')
export class NftProjectController {
  constructor(private readonly nftProjectService: NftProjectService) {}

  @Post(':projectId')
  @ApiOperation({ summary: 'Crear NFT para un proyecto' })
  create(@Param('projectId') projectId: string, @Body() dto: CreateNftProjectDto) {
    return this.nftProjectService.create(projectId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los NFTs de proyectos' })
  findAll() {
    return this.nftProjectService.findAll();
  }

  @Get('by-project/:projectId')
  @ApiOperation({ summary: 'Obtener el NFT de un proyecto específico' })
  findByProject(@Param('projectId') projectId: string) {
    return this.nftProjectService.findByProject(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un NFT de proyecto por ID' })
  findOne(@Param('id') id: string) {
    return this.nftProjectService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un NFT de proyecto' })
  update(@Param('id') id: string, @Body() dto: UpdateNftProjectDto) {
    return this.nftProjectService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un NFT de proyecto' })
  remove(@Param('id') id: string) {
    return this.nftProjectService.remove(id);
  }

  // GET /nft-projects/check/:projectId
  @Get('check/:projectId')
  @ApiOperation({
    summary: 'Verificar si un proyecto tiene NFT activo',
    description: 'Punto de bifurcación del flujo. Si `hasNft = false`, el frontend debe ofrecer la Compuerta 2.',
  })
  checkNftStatus(@Param('projectId') projectId: string) {
    return this.nftProjectService.checkNftStatus(projectId);
  }

  // POST /nft-projects/associate
  @Post('associate')
  @ApiOperation({
    summary: 'Compuerta 2 — Asociar NFT existente a un proyecto',
    description: 'El emprendedor vincula un NFT que ya existe en el sistema a su proyecto.',
  })
  associateToProject(@Body() dto: { nftProjectId: string; projectId: string }) {
    return this.nftProjectService.associateToProject(
      dto.nftProjectId,
      dto.projectId,
    );
  }
}