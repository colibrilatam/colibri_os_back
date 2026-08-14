// src/micro-action-instance/micro-action-instance.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, DataSource } from 'typeorm';
import {
  MicroActionInstance,
  MicroActionInstanceStatus,
} from './entities/micro-action-instance.entity';
import {
  MicroActionInstanceVersion,
  MicroActionInstanceChangeType,
} from './entities/micro-action-instance-version.entity';
import { CreateMicroActionInstanceDto } from './dto/create-micro-action-instance.dto';
import { UpdateMicroActionInstanceDto } from './dto/update-micro-action-instance.dto';
import { ProjectAccessService, ProjectPrincipal } from '../projects/project-access.service';
import { UserRole } from '../users/entities/user.entity';

function getAllowedTransitions(): {
  [key in MicroActionInstanceStatus]: MicroActionInstanceStatus[];
} {
  return {
    pending: [MicroActionInstanceStatus.STARTED],
    started: [MicroActionInstanceStatus.IN_PROGRESS, MicroActionInstanceStatus.SUBMITTED],
    in_progress: [MicroActionInstanceStatus.SUBMITTED],
    submitted: [MicroActionInstanceStatus.VALIDATED, MicroActionInstanceStatus.REOPENED],
    validated: [MicroActionInstanceStatus.COMPLETED],
    completed: [MicroActionInstanceStatus.CLOSED],
    closed: [],
    reopened: [MicroActionInstanceStatus.IN_PROGRESS, MicroActionInstanceStatus.SUBMITTED],
  };
}

@Injectable()
export class MicroActionInstanceService {
  constructor(
    @InjectRepository(MicroActionInstance)
    private readonly repo: Repository<MicroActionInstance>,

    @InjectRepository(MicroActionInstanceVersion)
    private readonly versionRepo: Repository<MicroActionInstanceVersion>,

    private readonly projectAccess: ProjectAccessService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    principal: ProjectPrincipal,
    dto: CreateMicroActionInstanceDto,
  ): Promise<MicroActionInstance> {
    await this.projectAccess.assertCanAccessProject(principal, dto.projectId);

    const instance = new MicroActionInstance();
    instance.actorUserId = principal.userId;
    instance.projectId = dto.projectId;
    instance.microActionDefinitionId = dto.microActionDefinitionId;
    instance.executionWindowDaysSnapshot = dto.executionWindowDaysSnapshot ?? null;
    instance.executionNotes = dto.executionNotes ?? null;
    instance.status = MicroActionInstanceStatus.PENDING;
    instance.startedAt = new Date();
    instance.attemptNumber = 1;
    instance.reopenedCount = 0;

    return this.dataSource.transaction(async (manager) => {
      const saved = await manager.save(MicroActionInstance, instance);

      await this.createVersion(manager, saved, {
        changeType: MicroActionInstanceChangeType.CREATED,
        previousStatus: null,
        createdByUserId: principal.userId,
        changeSummary: 'Instancia creada',
      });

      return saved;
    });
  }

  async findAllByProject(
    projectId: string,
    principal: ProjectPrincipal,
  ): Promise<MicroActionInstance[]> {
    await this.projectAccess.assertCanAccessProject(principal, projectId);
    return this.repo.find({
      where: { projectId },
      relations: ['microActionDefinition', 'evidences'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllByUser(actorUserId: string): Promise<MicroActionInstance[]> {
    return this.repo.find({
      where: { actorUserId },
      relations: ['microActionDefinition', 'project'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<MicroActionInstance> {
    const instance = await this.repo.findOne({
      where: { id },
      relations: ['microActionDefinition', 'evidences', 'actor', 'project'],
    });

    if (!instance) {
      throw new NotFoundException(`MicroActionInstance ${id} no encontrada`);
    }

    return instance;
  }

  async findOneAuthorized(id: string, principal: ProjectPrincipal): Promise<MicroActionInstance> {
    const instance = await this.findOne(id);
    await this.projectAccess.assertCanAccessProject(principal, instance.projectId);
    return instance;
  }

  async findVersions(
    id: string,
    principal: ProjectPrincipal,
  ): Promise<MicroActionInstanceVersion[]> {
    await this.findOneAuthorized(id, principal);

    return this.versionRepo.find({
      where: { microActionInstanceId: id },
      order: { versionNumber: 'DESC' },
    });
  }

  async update(
    id: string,
    principal: ProjectPrincipal,
    dto: UpdateMicroActionInstanceDto,
  ): Promise<MicroActionInstance> {
    const instance = await this.findOneAuthorized(id, principal);

    this.assertOwnership(instance, principal);

    const previousStatus = instance.status;
    let statusChanged = false;
    let notesChanged = false;

    if (dto.status) {
      this.validateTransition(instance.status, dto.status);
      this.applyStatusTimestamps(instance, dto.status);
      instance.status = dto.status;
      statusChanged = true;
    }

    if (dto.executionNotes !== undefined && dto.executionNotes !== instance.executionNotes) {
      instance.executionNotes = dto.executionNotes;
      notesChanged = true;
    }

    if (!statusChanged && !notesChanged) {
      // Nada cambió realmente: no generamos una versión vacía.
      return instance;
    }

    return this.dataSource.transaction(async (manager) => {
      const saved = await manager.save(MicroActionInstance, instance);

      await this.createVersion(manager, saved, {
        changeType: statusChanged
          ? MicroActionInstanceChangeType.STATUS_CHANGE
          : MicroActionInstanceChangeType.NOTES_UPDATE,
        previousStatus: statusChanged ? previousStatus : null,
        createdByUserId: principal.userId,
        changeSummary:
          dto.changeSummary ??
          (statusChanged
            ? `Cambio de estado: ${previousStatus} → ${saved.status}`
            : 'Actualización de notas de ejecución'),
      });

      return saved;
    });
  }

  async submit(id: string, principal: ProjectPrincipal): Promise<MicroActionInstance> {
    const instance = await this.findOneAuthorized(id, principal);

    this.assertOwnership(instance, principal);
    this.validateTransition(instance.status, MicroActionInstanceStatus.SUBMITTED);

    const previousStatus = instance.status;
    instance.status = MicroActionInstanceStatus.SUBMITTED;
    instance.submittedAt = new Date();

    return this.dataSource.transaction(async (manager) => {
      const saved = await manager.save(MicroActionInstance, instance);

      await this.createVersion(manager, saved, {
        changeType: MicroActionInstanceChangeType.SUBMITTED,
        previousStatus,
        createdByUserId: principal.userId,
        changeSummary: 'Instancia enviada a evaluación',
      });

      return saved;
    });
  }

  async reopen(id: string, principal: ProjectPrincipal): Promise<MicroActionInstance> {
    const instance = await this.findOneAuthorized(id, principal);

    this.assertOwnership(instance, principal);
    this.validateTransition(instance.status, MicroActionInstanceStatus.REOPENED);

    const previousStatus = instance.status;
    instance.status = MicroActionInstanceStatus.REOPENED;
    instance.reopenedCount += 1;
    instance.attemptNumber += 1;

    return this.dataSource.transaction(async (manager) => {
      const saved = await manager.save(MicroActionInstance, instance);

      await this.createVersion(manager, saved, {
        changeType: MicroActionInstanceChangeType.REOPENED,
        previousStatus,
        createdByUserId: principal.userId,
        changeSummary: `Instancia reabierta (intento #${saved.attemptNumber})`,
      });

      return saved;
    });
  }

  async remove(id: string, principal: ProjectPrincipal): Promise<void> {
    const instance = await this.findOneAuthorized(id, principal);

    this.assertOwnership(instance, principal);

    const deletableStatuses: MicroActionInstanceStatus[] = [
      MicroActionInstanceStatus.STARTED,
      MicroActionInstanceStatus.IN_PROGRESS,
    ];

    if (!deletableStatuses.includes(instance.status)) {
      throw new BadRequestException(
        `No se puede eliminar una instancia en estado "${instance.status}"`,
      );
    }

    await this.repo.remove(instance);
  }

  // ─── Helpers privados ────────────────────────────────────────────────────────

  private async createVersion(
    manager: EntityManager,
    instance: MicroActionInstance,
    options: {
      changeType: MicroActionInstanceChangeType;
      previousStatus: MicroActionInstanceStatus | null;
      createdByUserId: string;
      changeSummary?: string;
    },
  ): Promise<MicroActionInstanceVersion> {
    const lastVersion = await manager.getRepository(MicroActionInstanceVersion).findOne({
      where: { microActionInstanceId: instance.id },
      order: { versionNumber: 'DESC' },
    });
    const nextVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    const version = manager.create(MicroActionInstanceVersion, {
      microActionInstanceId: instance.id,
      versionNumber: nextVersionNumber,
      changeType: options.changeType,
      status: instance.status,
      previousStatus: options.previousStatus,
      executionNotes: instance.executionNotes,
      attemptNumber: instance.attemptNumber,
      reopenedCount: instance.reopenedCount,
      changeSummary: options.changeSummary ?? null,
      supersedesVersionNumber: lastVersion?.versionNumber ?? undefined,
      createdByUserId: options.createdByUserId,
    } as MicroActionInstanceVersion);

    return manager.save(MicroActionInstanceVersion, version);
  }

  private assertOwnership(instance: MicroActionInstance, principal: ProjectPrincipal): void {
    if (principal.role !== UserRole.ADMIN && instance.actorUserId !== principal.userId) {
      throw new ForbiddenException('No tenés permiso para modificar esta instancia');
    }
  }

  private validateTransition(
    current: MicroActionInstanceStatus,
    next: MicroActionInstanceStatus,
  ): void {
    const allowed = getAllowedTransitions()[current];
    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Transición inválida: de "${current}" a "${next}" no está permitida`,
      );
    }
  }

  private applyStatusTimestamps(
    instance: MicroActionInstance,
    newStatus: MicroActionInstanceStatus,
  ): void {
    const now = new Date();
    switch (newStatus) {
      case MicroActionInstanceStatus.IN_PROGRESS:
        if (!instance.startedAt) instance.startedAt = now;
        break;
      case MicroActionInstanceStatus.SUBMITTED:
        instance.submittedAt = now;
        break;
      case MicroActionInstanceStatus.VALIDATED:
        instance.validatedAt = now;
        break;
      case MicroActionInstanceStatus.COMPLETED:
        instance.completedAt = now;
        if (instance.executionWindowDaysSnapshot) {
          instance.isOnTime = this.checkOnTime(instance);
        }
        break;
      case MicroActionInstanceStatus.CLOSED:
        instance.closedAt = now;
        break;
    }
  }

  private checkOnTime(instance: MicroActionInstance): boolean {
    if (!instance.startedAt || !instance.executionWindowDaysSnapshot) {
      return false;
    }
    const diffMs = new Date().getTime() - instance.startedAt.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= instance.executionWindowDaysSnapshot;
  }
}