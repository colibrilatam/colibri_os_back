import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NftProjectService } from './nfts-project.service';
import { CreateNftProjectDto } from './dto/create-nft-project.dto';
import { UpdateNftProjectDto } from './dto/update-nft-project.dto';
import { JwtAuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { ProjectAccessService } from '../../projects/project-access.service';

@ApiTags('NFT Projects')
@Controller('nft-projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NftProjectController {
  constructor(
    private readonly nftProjectService: NftProjectService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  @Post(':projectId')
  @ApiOperation({ summary: 'Crear NFT para un proyecto' })
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateNftProjectDto,
    @CurrentUser() principal: { sub: string; role: UserRole },
  ) {
    await this.projectAccess.assertCanManageProject(
      { userId: principal.sub, role: principal.role },
      projectId,
    );
    return this.nftProjectService.create(projectId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener todos los NFTs de proyectos' })
  findAll() {
    return this.nftProjectService.findAll();
  }

  @Get('by-project/:projectId')
  @ApiOperation({ summary: 'Obtener el NFT de un proyecto específico' })
  async findByProject(
    @Param('projectId') projectId: string,
    @CurrentUser() principal: { sub: string; role: UserRole },
  ) {
    await this.projectAccess.assertCanAccessProject(
      { userId: principal.sub, role: principal.role },
      projectId,
    );
    return this.nftProjectService.findByProject(projectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un NFT de proyecto por ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() principal: { sub: string; role: UserRole },
  ) {
    const nft = await this.nftProjectService.findOne(id);
    await this.assertCanAccessNft(nft.projectId, principal);
    return nft;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un NFT de proyecto' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateNftProjectDto,
    @CurrentUser() principal: { sub: string; role: UserRole },
  ) {
    const nft = await this.nftProjectService.findOne(id);
    await this.assertCanManageNft(nft.projectId, principal);
    return this.nftProjectService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar un NFT de proyecto' })
  remove(@Param('id') id: string) {
    return this.nftProjectService.remove(id);
  }

  // GET /nft-projects/check/:projectId
  @Get('check/:projectId')
  @ApiOperation({
    summary: 'Verificar si un proyecto tiene NFT activo',
    description:
      'Punto de bifurcación del flujo. Si `hasNft = false`, el frontend debe ofrecer la Compuerta 2.',
  })
  async checkNftStatus(
    @Param('projectId') projectId: string,
    @CurrentUser() principal: { sub: string; role: UserRole },
  ) {
    await this.projectAccess.assertCanAccessProject(
      { userId: principal.sub, role: principal.role },
      projectId,
    );
    return this.nftProjectService.checkNftStatus(projectId);
  }

  // POST /nft-projects/associate
  @Post('associate')
  @ApiOperation({
    summary: 'Compuerta 2 — Asociar NFT existente a un proyecto',
    description: 'El emprendedor vincula un NFT que ya existe en el sistema a su proyecto.',
  })
  async associateToProject(
    @Body() dto: { nftProjectId: string; projectId: string },
    @CurrentUser() principal: { sub: string; role: UserRole },
  ) {
    await this.projectAccess.assertCanManageProject(
      { userId: principal.sub, role: principal.role },
      dto.projectId,
    );
    const nft = await this.nftProjectService.findOne(dto.nftProjectId);
    if (principal.role !== UserRole.ADMIN && nft.currentHolderUserId !== principal.sub) {
      throw new ForbiddenException('No tenÃ©s permiso para asociar este NFT');
    }
    return this.nftProjectService.associateToProject(dto.nftProjectId, dto.projectId);
  }

  private async assertCanAccessNft(
    projectId: string | null,
    principal: { sub: string; role: UserRole },
  ): Promise<void> {
    if (!projectId) {
      if (principal.role !== UserRole.ADMIN)
        throw new ForbiddenException('NFT no asociado: solo ADMIN');
      return;
    }
    await this.projectAccess.assertCanAccessProject(
      { userId: principal.sub, role: principal.role },
      projectId,
    );
  }

  private async assertCanManageNft(
    projectId: string | null,
    principal: { sub: string; role: UserRole },
  ): Promise<void> {
    if (!projectId) {
      if (principal.role !== UserRole.ADMIN)
        throw new ForbiddenException('NFT no asociado: solo ADMIN');
      return;
    }
    await this.projectAccess.assertCanManageProject(
      { userId: principal.sub, role: principal.role },
      projectId,
    );
  }
}
