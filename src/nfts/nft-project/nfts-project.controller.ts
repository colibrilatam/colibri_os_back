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
}