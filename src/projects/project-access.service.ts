import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../users/entities/user.entity';
import { ProjectMember } from '../project-members/entities/project-member.entity';
import { Project } from './entities/project.entity';
import { AuthorizationAuditService } from '../authorization-audit/authorization-audit.service';
import { DenialReason } from '../authorization-audit/entities/authorization-denial-audit.entity';

export interface ProjectPrincipal {
  userId: string;
  role: UserRole;
}

@Injectable()
export class ProjectAccessService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    private readonly auditService: AuthorizationAuditService,
  ) {}

  async assertCanAccessProject(principal: ProjectPrincipal, projectId: string): Promise<Project> {
    const project = await this.findProject(projectId);

    if (principal.role === UserRole.ADMIN || principal.role === UserRole.EVALUATOR || project.ownerUserId === principal.userId) {
      return project;
    }

    const membership = await this.projectMemberRepository.findOne({
      where: { projectId, userId: principal.userId, isActive: true },
    });

    if (!membership) {
      await this.auditService.logDenial({
        resourceType: 'project',
        resourceId: projectId,
        action: 'access',
        attemptedByUserId: principal.userId,
        attemptedByRole: principal.role,
        reason: DenialReason.NOT_OWNER_OR_MEMBER,
      });
      throw new ForbiddenException('No tenés acceso a este proyecto');
    }

    return project;
  }

  async assertCanManageProject(principal: ProjectPrincipal, projectId: string): Promise<Project> {
    const project = await this.findProject(projectId);

    if (principal.role === UserRole.ADMIN || project.ownerUserId === principal.userId) {
      return project;
    }

    const membership = await this.projectMemberRepository.findOne({
      where: {
        projectId,
        userId: principal.userId,
        isActive: true,
        isPrimaryOperator: true,
      },
    });

    if (!membership) {
      await this.auditService.logDenial({
        resourceType: 'project',
        resourceId: projectId,
        action: 'manage',
        attemptedByUserId: principal.userId,
        attemptedByRole: principal.role,
        reason: DenialReason.NOT_PRIMARY_OPERATOR,
      });
      throw new ForbiddenException('No tenés permiso para administrar este proyecto');
    }

    return project;
  }

  private async findProject(projectId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`Proyecto ${projectId} no encontrado`);
    }
    return project;
  }
}
