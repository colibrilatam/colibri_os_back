import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../users/entities/user.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectMember } from '../project-members/entities/project-member.entity';
import { Evaluation } from '../evaluation/entities/evaluation.entity';
import { AuthorizationAuditService } from '../authorization-audit/authorization-audit.service';
import { DenialReason } from '../authorization-audit/entities/authorization-denial-audit.entity';

export interface Actor {
  userId: string;
  role: UserRole;
}

export type ResourceType =
  | 'project'
  | 'projectMember'
  | 'projectProfile'
  | 'projectPac'
  | 'tramo'
  | 'tramoClosure'
  | 'microActionInstance'
  | 'evidence'
  | 'evaluation'
  | 'nftProject'
  | 'mecenasNftPortfolio'
  | 'nftOwnershipEvent'
  | 'nftActor'
  | 'digitalCredential'
  | 'reputation'
  | 'user';

export type Action =
  'create' | 'read' | 'update' | 'delete' | 'manage' | 'approve' | 'submit' | 'revoke' | 'assign';

@Injectable()
export class AuthorizationService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository: Repository<ProjectMember>,
    @InjectRepository(Evaluation)
    private readonly evaluationRepository: Repository<Evaluation>,
    private readonly auditService: AuthorizationAuditService,
  ) {}

  async can(
    actor: Actor,
    action: Action,
    resourceType: ResourceType,
    resourceId: string,
  ): Promise<boolean> {
    switch (resourceType) {
      case 'project':
        return this.canAccessProject(actor, action, resourceId);
      case 'evaluation':
        return this.canAccessEvaluation(actor, action, resourceId);
      case 'evidence':
        return this.canAccessEvidence(actor, action, resourceId);
      case 'user':
        return this.canAccessUser(actor, action, resourceId);
      default:
        throw new ForbiddenException(`Recurso no soportado: ${resourceType}`);
    }
  }

  async assertCanAccessProject(actor: Actor, projectId: string): Promise<Project> {
    const project = await this.findProject(projectId);

    if (actor.role === UserRole.ADMIN || project.ownerUserId === actor.userId) {
      return project;
    }

    const membership = await this.projectMemberRepository.findOne({
      where: { projectId, userId: actor.userId, isActive: true },
    });

    if (!membership) {
      await this.logDenial({
        resourceType: 'project',
        resourceId: projectId,
        action: 'access',
        attemptedByUserId: actor.userId,
        attemptedByRole: actor.role,
        reason: DenialReason.NOT_OWNER_OR_MEMBER,
      });
      throw new ForbiddenException('No tenés acceso a este proyecto');
    }

    return project;
  }

  async assertCanManageProject(actor: Actor, projectId: string): Promise<Project> {
    const project = await this.findProject(projectId);

    if (actor.role === UserRole.ADMIN || project.ownerUserId === actor.userId) {
      return project;
    }

    const membership = await this.projectMemberRepository.findOne({
      where: {
        projectId,
        userId: actor.userId,
        isActive: true,
        isPrimaryOperator: true,
      },
    });

    if (!membership) {
      await this.logDenial({
        resourceType: 'project',
        resourceId: projectId,
        action: 'manage',
        attemptedByUserId: actor.userId,
        attemptedByRole: actor.role,
        reason: DenialReason.NOT_PRIMARY_OPERATOR,
      });
      throw new ForbiddenException('No tenés permiso para administrar este proyecto');
    }

    return project;
  }

  async assertAssignedEvaluator(actor: Actor, evaluation: Evaluation): Promise<void> {
    if (actor.role === UserRole.ADMIN) {
      return;
    }

    if (evaluation.createdByUserId && evaluation.createdByUserId === actor.userId) {
      return;
    }

    await this.logDenial({
      resourceType: 'evaluation',
      resourceId: evaluation.id,
      action: 'approve',
      attemptedByUserId: actor.userId,
      attemptedByRole: actor.role,
      reason: DenialReason.NOT_ASSIGNED_EVALUATOR,
    });
    throw new ForbiddenException('No estás asignado como evaluador de esta evidencia');
  }

  async assertOwnership(resourceUserId: string, actor: Actor): Promise<void> {
    if (actor.role === UserRole.ADMIN) {
      return;
    }

    if (resourceUserId !== actor.userId) {
      await this.logDenial({
        resourceType: 'user',
        resourceId: resourceUserId,
        action: 'access',
        attemptedByUserId: actor.userId,
        attemptedByRole: actor.role,
        reason: DenialReason.NOT_OWNER,
      });
      throw new ForbiddenException('No tenés permiso para operar sobre este recurso');
    }
  }

  async isEvaluatorAssignedToProject(actor: Actor, projectId: string): Promise<boolean> {
    if (actor.role === UserRole.ADMIN) {
      return true;
    }

    const evaluation = await this.evaluationRepository.findOne({
      where: { createdByUserId: actor.userId },
      relations: ['evidence'],
    });

    if (!evaluation) {
      return false;
    }

    return evaluation.evidence.projectId === projectId;
  }

  private async canAccessProject(
    actor: Actor,
    action: Action,
    projectId: string,
  ): Promise<boolean> {
    try {
      if (action === 'read') {
        await this.assertCanAccessProject(actor, projectId);
      } else {
        await this.assertCanManageProject(actor, projectId);
      }
      return true;
    } catch {
      return false;
    }
  }

  private async canAccessEvaluation(
    actor: Actor,
    action: Action,
    evaluationId: string,
  ): Promise<boolean> {
    try {
      const evaluation = await this.evaluationRepository.findOne({
        where: { id: evaluationId },
        relations: ['evidence'],
      });

      if (!evaluation) {
        throw new NotFoundException('Evaluación no encontrada');
      }

      await this.assertCanAccessProject(actor, evaluation.evidence.projectId);

      if (action === 'approve' || action === 'update') {
        await this.assertAssignedEvaluator(actor, evaluation);
      }

      return true;
    } catch {
      return false;
    }
  }

  private async canAccessEvidence(
    actor: Actor,
    action: Action,
    evidenceId: string,
  ): Promise<boolean> {
    try {
      const evidence = (await this.evaluationRepository.manager.query(
        'SELECT project_id FROM evidences WHERE id = $1',
        [evidenceId],
      )) as Array<{ project_id: string }>;

      if (!evidence || evidence.length === 0) {
        throw new NotFoundException('Evidencia no encontrada');
      }

      await this.assertCanAccessProject(actor, evidence[0].project_id);
      return true;
    } catch {
      return false;
    }
  }

  private canAccessUser(actor: Actor, action: Action, userId: string): boolean {
    if (actor.role === UserRole.ADMIN || actor.userId === userId) {
      return true;
    }
    return false;
  }

  private async findProject(projectId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`Proyecto ${projectId} no encontrado`);
    }
    return project;
  }

  private async logDenial(input: {
    resourceType: string;
    resourceId: string;
    action: string;
    attemptedByUserId: string;
    attemptedByRole: UserRole;
    reason: DenialReason;
  }): Promise<void> {
    await this.auditService.logDenial(input);
  }
}
