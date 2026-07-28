import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProjectMemberService } from './project-members.service';
import { CreateProjectMemberDto } from './dto/create-project-member.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ProjectAccessService } from '../projects/project-access.service';

@ApiTags('Project Members')
@Controller('projects/:projectId/members')
@UseGuards(JwtAuthGuard)
export class ProjectMemberController {
  constructor(
    private readonly projectMemberService: ProjectMemberService,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Agregar un miembro al proyecto' })
  async create(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Body() dto: CreateProjectMemberDto,
  ) {
    await this.projectAccessService.assertCanManageProject({ userId, role }, projectId);
    return this.projectMemberService.create(projectId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los miembros del proyecto' })
  async findAll(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    await this.projectAccessService.assertCanAccessProject({ userId, role }, projectId);
    return this.projectMemberService.findAll(projectId);
  }

  @Get(':memberId')
  @ApiOperation({ summary: 'Obtener un miembro del proyecto' })
  async findOne(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    await this.projectAccessService.assertCanAccessProject({ userId, role }, projectId);
    return this.projectMemberService.findOne(projectId, memberId);
  }

  @Patch(':memberId')
  @ApiOperation({ summary: 'Actualizar un miembro del proyecto' })
  async update(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Body() dto: UpdateProjectMemberDto,
  ) {
    await this.projectAccessService.assertCanManageProject({ userId, role }, projectId);
    return this.projectMemberService.update(projectId, memberId, dto);
  }

  @Delete(':memberId')
  @ApiOperation({ summary: 'Dar de baja un miembro del proyecto' })
  async remove(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    await this.projectAccessService.assertCanManageProject({ userId, role }, projectId);
    return this.projectMemberService.remove(projectId, memberId);
  }
}
