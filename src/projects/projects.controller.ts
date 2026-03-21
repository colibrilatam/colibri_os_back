import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un proyecto' })
  create(@Body() dto: CreateProjectDto) {
    // TODO: reemplazar por usuario autenticado cuando haya auth
    const ownerUserId = 'owner-uuid-placeholder';
    return this.projectsService.create(ownerUserId, dto);
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
  @ApiOperation({ summary: 'Actualizar un proyecto' })
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un proyecto' })
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}