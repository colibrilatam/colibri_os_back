// src/micro-action-instance/micro-action-instance.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MicroActionInstance,
  MicroActionInstanceStatus,
} from './entities/micro-action-instance.entity';
import { CreateMicroActionInstanceDto } from './dto/create-micro-action-instance.dto';
import { UpdateMicroActionInstanceDto } from './dto/update-micro-action-instance.dto';

function getAllowedTransitions(): {
  [key in MicroActionInstanceStatus]: MicroActionInstanceStatus[];
} {
  return {
    started: [
      MicroActionInstanceStatus.IN_PROGRESS,
      MicroActionInstanceStatus.SUBMITTED,
    ],
    in_progress: [
      MicroActionInstanceStatus.SUBMITTED,
    ],
    submitted: [
      MicroActionInstanceStatus.VALIDATED,
      MicroActionInstanceStatus.REOPENED,
    ],
    validated: [
      MicroActionInstanceStatus.COMPLETED,
    ],
    completed: [
      MicroActionInstanceStatus.CLOSED,
    ],
    closed: [],
    reopened: [
      MicroActionInstanceStatus.IN_PROGRESS,
      MicroActionInstanceStatus.SUBMITTED,
    ],
  };
}

@Injectable()
export class MicroActionInstanceService {
  constructor(
    @InjectRepository(MicroActionInstance)
    private readonly repo: Repository<MicroActionInstance>,
  ) {}

  async create(
    actorUserId: string,
    dto: CreateMicroActionInstanceDto,
  ): Promise<MicroActionInstance> {
    const instance = new MicroActionInstance();
    instance.actorUserId = actorUserId;
    instance.projectId = dto.projectId;
    instance.microActionDefinitionId = dto.microActionDefinitionId;
    instance.executionWindowDaysSnapshot = dto.executionWindowDaysSnapshot ?? null;
    instance.executionNotes = dto.executionNotes ?? null;
    instance.status = MicroActionInstanceStatus.STARTED;
    instance.startedAt = new Date();
    instance.attemptNumber = 1;
    instance.reopenedCount = 0;

    return this.repo.save(instance);
  }

  async findAllByProject(projectId: string): Promise<MicroActionInstance[]> {
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

  async update(
    id: string,
    actorUserId: string,
    dto: UpdateMicroActionInstanceDto,
  ): Promise<MicroActionInstance> {
    const instance = await this.findOne(id);

    this.assertOwnership(instance, actorUserId);

    if (dto.status) {
      this.validateTransition(instance.status, dto.status);
      this.applyStatusTimestamps(instance, dto.status);
      instance.status = dto.status;
    }

    if (dto.executionNotes !== undefined) {
      instance.executionNotes = dto.executionNotes;
    }

    return this.repo.save(instance);
  }

  async submit(
    id: string,
    actorUserId: string,
  ): Promise<MicroActionInstance> {
    const instance = await this.findOne(id);

    this.assertOwnership(instance, actorUserId);
    this.validateTransition(
      instance.status,
      MicroActionInstanceStatus.SUBMITTED,
    );

    instance.status = MicroActionInstanceStatus.SUBMITTED;
    instance.submittedAt = new Date();

    return this.repo.save(instance);
  }

  async reopen(
    id: string,
    actorUserId: string,
  ): Promise<MicroActionInstance> {
    const instance = await this.findOne(id);

    this.assertOwnership(instance, actorUserId);
    this.validateTransition(
      instance.status,
      MicroActionInstanceStatus.REOPENED,
    );

    instance.status = MicroActionInstanceStatus.REOPENED;
    instance.reopenedCount += 1;
    instance.attemptNumber += 1;

    return this.repo.save(instance);
  }

  async remove(id: string, actorUserId: string): Promise<void> {
    const instance = await this.findOne(id);

    this.assertOwnership(instance, actorUserId);

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

  private assertOwnership(
    instance: MicroActionInstance,
    actorUserId: string,
  ): void {
    if (instance.actorUserId !== actorUserId) {
      throw new ForbiddenException(
        'No tenés permiso para modificar esta instancia',
      );
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