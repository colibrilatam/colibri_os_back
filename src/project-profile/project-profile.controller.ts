import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectProfileService } from './project-profile.service';
import { CreateProjectProfileDto } from './dto/create-project-profile.dto';
import { UpdateProjectProfileDto } from './dto/update-project-profile.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ProjectAccessService } from '../projects/project-access.service';

@ApiTags('Project Profile')
@Controller('projects/:projectId/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectProfileController {
  constructor(
    private readonly projectProfileService: ProjectProfileService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear el perfil de un proyecto' })
  async create(
    @Param('projectId') projectId: string,
    @CurrentUser() principal: { sub: string; role: UserRole },
    @Body() dto: CreateProjectProfileDto,
  ) {
    await this.projectAccess.assertCanManageProject(
      { userId: principal.sub, role: principal.role },
      projectId,
    );
    return this.projectProfileService.create(projectId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener el perfil de un proyecto' })
  async findOne(
    @Param('projectId') projectId: string,
    @CurrentUser() principal: { sub: string; role: UserRole },
  ) {
    await this.projectAccess.assertCanAccessProject(
      { userId: principal.sub, role: principal.role },
      projectId,
    );
    return this.projectProfileService.findOne(projectId);
  }

  @Patch()
  @ApiOperation({ summary: 'Actualizar el perfil de un proyecto' })
  async update(
    @Param('projectId') projectId: string,
    @CurrentUser() principal: { sub: string; role: UserRole },
    @Body() dto: UpdateProjectProfileDto,
  ) {
    await this.projectAccess.assertCanManageProject(
      { userId: principal.sub, role: principal.role },
      projectId,
    );
    return this.projectProfileService.update(projectId, dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Eliminar el perfil de un proyecto' })
  async remove(
    @Param('projectId') projectId: string,
    @CurrentUser() principal: { sub: string; role: UserRole },
  ) {
    await this.projectAccess.assertCanManageProject(
      { userId: principal.sub, role: principal.role },
      projectId,
    );
    return this.projectProfileService.remove(projectId);
  }
}
