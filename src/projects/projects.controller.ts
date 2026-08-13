import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from 'src/auth/guards/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { ProjectPacStatus } from './entities/project.pac.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ProjectAccessService } from './project-access.service';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  create(
    @CurrentUser('id') ownerUserId: string,
    @Body() dto: CreateProjectDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.projectsService.create(ownerUserId, dto, file);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los proyectos' })
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un proyecto por ID' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un proyecto' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Body() dto: UpdateProjectDto,
  ) {
    await this.projectAccessService.assertCanManageProject({ userId, role }, id);
    return this.projectsService.update(id, dto, { userId, role });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un proyecto' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    await this.projectAccessService.assertCanManageProject({ userId, role }, id);
    return this.projectsService.remove(id, { userId, role });
  }

  @Patch('pac/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar el estado de un PAC de un proyecto' })
  async updateProjectPac(
    @Param('id') projectPacId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Body('status') status: ProjectPacStatus,
  ) {
    const projectPac = await this.projectsService.findProjectPac(projectPacId);
    await this.projectAccessService.assertCanManageProject({ userId, role }, projectPac.projectId);
    return await this.projectsService.updateProjectPac(projectPacId, status, { userId, role });
  }

  @Delete('pac/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un PAC de un proyecto' })
  async removeProjectPac(
    @Param('id') projectPacId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    // OJO: el projectId sale del ProjectPac encontrado en base (no del input del
    // usuario), así que no hay forma de "apuntar" a un proyecto propio para
    // colarse y borrar el PAC de un proyecto ajeno.
    const projectPac = await this.projectsService.findProjectPac(projectPacId);
    await this.projectAccessService.assertCanManageProject({ userId, role }, projectPac.projectId);
    await this.projectsService.removeProjectPac(projectPacId, { userId, role });
  }

  @Post(':projectId/pac/:pacId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un ProjectPac' })
  async createProjectPac(
    @Param('projectId') projectId: string,
    @Param('pacId') pacId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    await this.projectAccessService.assertCanManageProject({ userId, role }, projectId);
    return await this.projectsService.createProjectPac(projectId, pacId, { userId, role });
  }
}