import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectMemberService } from './project-members.service';
import { CreateProjectMemberDto } from './dto/create-project-member.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';

@ApiTags('Project Members')
@Controller('projects/:projectId/members')
export class ProjectMemberController {
  constructor(private readonly projectMemberService: ProjectMemberService) {}

  @Post()
  @ApiOperation({ summary: 'Agregar un miembro al proyecto' })
  create(@Param('projectId') projectId: string, @Body() dto: CreateProjectMemberDto) {
    return this.projectMemberService.create(projectId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los miembros del proyecto' })
  findAll(@Param('projectId') projectId: string) {
    return this.projectMemberService.findAll(projectId);
  }

  @Get(':memberId')
  @ApiOperation({ summary: 'Obtener un miembro del proyecto' })
  findOne(@Param('projectId') projectId: string, @Param('memberId') memberId: string) {
    return this.projectMemberService.findOne(projectId, memberId);
  }

  @Patch(':memberId')
  @ApiOperation({ summary: 'Actualizar un miembro del proyecto' })
  update(@Param('projectId') projectId: string, @Param('memberId') memberId: string, @Body() dto: UpdateProjectMemberDto) {
    return this.projectMemberService.update(projectId, memberId, dto);
  }

  @Delete(':memberId')
  @ApiOperation({ summary: 'Dar de baja un miembro del proyecto' })
  remove(@Param('projectId') projectId: string, @Param('memberId') memberId: string) {
    return this.projectMemberService.remove(projectId, memberId);
  }
}