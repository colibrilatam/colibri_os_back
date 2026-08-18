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
import { CreateVersionDto } from './dto/create-version.dto';
import { ResolveVersionDto } from './dto/resolve-version.dto';
import { ProjectAccessService, ProjectPrincipal } from '../projects/project-access.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class MicroActionInstanceService {
  constructor(
    @InjectRepository(MicroActionInstance)
    private readonly repo: Repository<MicroActionInstance>,

    @InjectRepository(MicroActionInstanceVersion)
    private readonly versionRepo: Repository<MicroActionInstanceVersion>,

    private readonly projectAccess: ProjectAccessService,
    private readonly cloudinaryService: CloudinaryService,
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

      await this.createVersionRecord(manager, saved, {
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
      relations: ['microActionDefinition', 'evidences', 'versions'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllByUser(actorUserId: string): Promise<MicroActionInstance[]> {
    return this.repo.find({
      where: { actorUserId },
      relations: ['microActionDefinition', 'project', 'versions'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<MicroActionInstance> {
    const instance = await this.repo.findOne({
      where: { id },
      relations: ['microActionDefinition', 'evidences', 'actor', 'project', 'versions'],
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

  async findAll(
    page?: number,
    limit?: number,
    status?: MicroActionInstanceStatus,
  ): Promise<{
    data: MicroActionInstance[];
    total: number;
    page: number;
    limit: number;
  }> {
    const pageNum = page && page > 0 ? page : 1;
    const limitNum = limit && limit > 0 ? limit : 10;

    const where = status ? { status } : {};

    const [data, total] = await this.repo.findAndCount({
      where,
      relations: ['microActionDefinition', 'project', 'versions'],
      order: { createdAt: 'DESC' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    return { data, total, page: pageNum, limit: limitNum };
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
      return instance;
    }

    return this.dataSource.transaction(async (manager) => {
      const saved = await manager.save(MicroActionInstance, instance);

      await this.createVersionRecord(manager, saved, {
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

  async remove(id: string, principal: ProjectPrincipal): Promise<void> {
    const instance = await this.findOneAuthorized(id, principal);

    this.assertOwnership(instance, principal);

    if (instance.status !== MicroActionInstanceStatus.PENDING) {
      throw new BadRequestException(
        `No se puede eliminar una instancia en estado "${instance.status}"`,
      );
    }

    await this.repo.remove(instance);
  }

  async createVersion(
    instanceId: string,
    principal: ProjectPrincipal,
    dto: CreateVersionDto,
    file: Express.Multer.File,
  ): Promise<MicroActionInstanceVersion> {
    const instance = await this.findOneAuthorized(instanceId, principal);
    this.assertOwnership(instance, principal);

    if (!file) {
      throw new BadRequestException('El archivo es requerido');
    }

    const lastVersion = await this.versionRepo.findOne({
      where: { microActionInstanceId: instanceId },
      order: { versionNumber: 'DESC' },
    });
    if (lastVersion && lastVersion.changeType !== MicroActionInstanceChangeType.REJECTED) {
      throw new BadRequestException(
        `Ya hay una versión con estado: ${lastVersion.changeType}`,
      );
    }
    const nextVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    const uploadResult = await this.cloudinaryService.uploadVersionFile(file, instanceId);

    instance.status = MicroActionInstanceStatus.SUBMITTED;
    instance.submittedAt = new Date();
    await this.repo.save(instance);

    const version = this.versionRepo.create({
      microActionInstanceId: instanceId,
      versionNumber: nextVersionNumber,
      changeType: MicroActionInstanceChangeType.SUBMITTED,
      status: MicroActionInstanceStatus.SUBMITTED,
      previousStatus: null,
      executionNotes: dto.executionNotes ?? instance.executionNotes,
      attemptNumber: instance.attemptNumber,
      reopenedCount: instance.reopenedCount,
      changeSummary: `Versión ${nextVersionNumber} enviada`,
      supersedesVersionNumber: lastVersion?.versionNumber ?? null,
      canonicalUri: uploadResult.secure_url,
      createdByUserId: principal.userId,
    });

    return this.versionRepo.save(version);
  }

  async resolveVersion(
    versionId: string,
    dto: ResolveVersionDto,
  ): Promise<MicroActionInstanceVersion> {
    const version = await this.versionRepo.findOne({
      where: { id: versionId },
      relations: ['microActionInstance'],
    });

    if (!version) {
      throw new NotFoundException(`Versión ${versionId} no encontrada`);
    }

    const changeType = dto.status;
    version.changeType = changeType;
    version.changeSummary = dto.summary ?? 'No se ingresó un resumen';

    if (changeType === MicroActionInstanceChangeType.COMPLETED) {
      const instance = version.microActionInstance;
      instance.status = MicroActionInstanceStatus.COMPLETED;
      instance.validatedAt = new Date();
      instance.closedAt = new Date();
      if (instance.startedAt) {
        const diffDays =
          (Date.now() - instance.startedAt.getTime()) / (1000 * 60 * 60 * 24);
        instance.executionWindowDaysSnapshot = Math.floor(diffDays);
      }
      await this.repo.save(instance);
    }

    if (changeType === MicroActionInstanceChangeType.REJECTED) {
      const instance = version.microActionInstance;
      instance.status = MicroActionInstanceStatus.PENDING;
      await this.repo.save(instance);
    }

    return this.versionRepo.save(version);
  }

  // ─── Helpers privados ────────────────────────────────────────────────────────

  private async createVersionRecord(
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
    if (current === MicroActionInstanceStatus.COMPLETED) {
      throw new BadRequestException(
        `Transición inválida: de "${current}" a "${next}" no está permitida`,
      );
    }
  }

  private applyStatusTimestamps(
    instance: MicroActionInstance,
    newStatus: MicroActionInstanceStatus,
  ): void {
    if (newStatus === MicroActionInstanceStatus.COMPLETED) {
      instance.completedAt = new Date();
      if (instance.executionWindowDaysSnapshot) {
        instance.isOnTime = this.checkOnTime(instance);
      }
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
