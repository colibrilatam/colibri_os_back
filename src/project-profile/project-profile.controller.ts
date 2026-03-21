import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectProfileService } from './project-profile.service';
import { CreateProjectProfileDto } from './dto/create-project-profile.dto';
import { UpdateProjectProfileDto } from './dto/update-project-profile.dto';

@ApiTags('Project Profile')
@Controller('projects/:projectId/profile')
export class ProjectProfileController {
  constructor(private readonly projectProfileService: ProjectProfileService) {}

  @Post()
  @ApiOperation({ summary: 'Crear el perfil de un proyecto' })
  create(@Param('projectId') projectId: string, @Body() dto: CreateProjectProfileDto) {
    return this.projectProfileService.create(projectId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener el perfil de un proyecto' })
  findOne(@Param('projectId') projectId: string) {
    return this.projectProfileService.findOne(projectId);
  }

  @Patch()
  @ApiOperation({ summary: 'Actualizar el perfil de un proyecto' })
  update(@Param('projectId') projectId: string, @Body() dto: UpdateProjectProfileDto) {
    return this.projectProfileService.update(projectId, dto);
  }

  @Delete()
  @ApiOperation({ summary: 'Eliminar el perfil de un proyecto' })
  remove(@Param('projectId') projectId: string) {
    return this.projectProfileService.remove(projectId);
  }
}