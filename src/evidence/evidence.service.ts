// src/evidence/evidence.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';
import { Evidence, EvidenceStatus, PrivacyLevel } from './entities/evidence.entity';
import { EvidenceVersion } from './entities/evidence-version.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { MicroActionInstanceService } from '../micro-action-instance/micro-action-instance.service';
import { MicroActionInstanceStatus } from '../micro-action-instance/entities/micro-action-instance.entity';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { UpdateEvidenceDto } from './dto/update-evidence.dto';
import { RequestUploadSignatureDto } from './dto/request-upload-signature.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { CloudinarySignature } from '../cloudinary/cloudinary.service';
import { UploadSession } from './entities/upload-session.entity';
import {
  EvidenceDeletionOutbox,
  DeletionOutboxStatus,
} from './entities/evidence-deletion-outbox.entity';
import { ProjectAccessService, ProjectPrincipal } from '../projects/project-access.service';

const MAX_EVIDENCE_FILE_BYTES = 25 * 1024 * 1024;
const UPLOAD_SESSION_TTL_MS = 10 * 60 * 1000;
const MAX_DELETION_ATTEMPTS = 5;

const EDITABLE_STATUSES: EvidenceStatus[] = [EvidenceStatus.DRAFT, EvidenceStatus.REJECTED];

@Injectable()
export class EvidenceService {
  private readonly logger = new Logger(EvidenceService.name);

  constructor(
    @InjectRepository(Evidence)
    private readonly evidenceRepo: Repository<Evidence>,

    @InjectRepository(EvidenceVersion)
    private readonly versionRepo: Repository<EvidenceVersion>,

    @InjectRepository(UploadSession)
    private readonly uploadSessionRepo: Repository<UploadSession>,

    @InjectRepository(EvidenceDeletionOutbox)
    private readonly outboxRepo: Repository<EvidenceDeletionOutbox>,

    private readonly cloudinaryService: CloudinaryService,
    private readonly microActionInstanceService: MicroActionInstanceService,
    private readonly projectAccessService: ProjectAccessService,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Crear evidencia en DRAFT ─────────────────────────────────────────────────

  async create(authorUserId: string, dto: CreateEvidenceDto): Promise<Evidence> {
    const instance = await this.microActionInstanceService.findOne(dto.microActionInstanceId);

    if (instance.actorUserId !== authorUserId) {
      throw new ForbiddenException('No tenés permiso para crear evidencia en esta microacción');
    }

    const validInstanceStatuses: MicroActionInstanceStatus[] = [
      MicroActionInstanceStatus.STARTED,
      MicroActionInstanceStatus.PENDING,
      MicroActionInstanceStatus.IN_PROGRESS,
      MicroActionInstanceStatus.REOPENED,
    ];

    if (!validInstanceStatuses.includes(instance.status)) {
      throw new BadRequestException(
        `No se puede crear evidencia para una microacción en estado "${instance.status}"`,
      );
    }

    const existingActive = await this.evidenceRepo.findOne({
      where: {
        microActionInstanceId: dto.microActionInstanceId,
        status: EvidenceStatus.SUBMITTED,
      },
    });

    if (existingActive) {
      throw new BadRequestException(
        'Ya existe una evidencia enviada para esta microacción. Esperá el resultado de la evaluación.',
      );
    }

    const evidence = this.evidenceRepo.create({
      microActionInstanceId: dto.microActionInstanceId,
      authorUserId,
      projectId: instance.projectId,
      evidenceType: dto.evidenceType,
      description: dto.description ?? null,
      canonicalUri: dto.canonicalUri ?? null,
      privacyLevel: dto.privacyLevel ?? PrivacyLevel.PRIVATE,
      publicSignalEnabled: dto.publicSignalEnabled ?? false,
      status: EvidenceStatus.DRAFT,
    } as Evidence);

    const saved = await this.evidenceRepo.save(evidence);
    this.logger.log(`Evidence ${saved.id} creada en DRAFT por usuario ${authorUserId}`);

    return saved;
  }

  // ─── Paso 1: Generar firma para upload directo a Cloudinary ───────────────────

  async requestUploadSignature(
    authorUserId: string,
    dto: RequestUploadSignatureDto,
  ): Promise<CloudinarySignature> {
    const evidence = await this.findOneAndAssertOwnership(dto.evidenceId, authorUserId);

    this.assertEditable(evidence);

    if (dto.evidenceType !== evidence.evidenceType) {
      throw new BadRequestException('El tipo de evidencia no coincide con el registro creado');
    }

    const signature = this.cloudinaryService.generateUploadSignature(
      evidence.projectId,
      evidence.id,
      dto.mimeType,
    );

    await this.uploadSessionRepo.update(
      { evidenceId: evidence.id, authorUserId, consumedAt: IsNull() },
      { expiresAt: new Date() },
    );

    await this.uploadSessionRepo.save(
      this.uploadSessionRepo.create({
        evidenceId: evidence.id,
        authorUserId,
        projectId: evidence.projectId,
        expectedPublicId: `${signature.folder}/${signature.publicId}.pdf`,
        folder: signature.folder,
        mimeType: dto.mimeType,
        resourceType: this.cloudinaryService.getResourceType(dto.mimeType),
        maxBytes: MAX_EVIDENCE_FILE_BYTES,
        expiresAt: new Date(Date.now() + UPLOAD_SESSION_TTL_MS),
        consumedAt: null,
      }),
    );

    this.logger.log(`Firma de upload generada para evidence ${evidence.id}`);

    return signature;
  }

  // ─── Paso 2: Confirmar que el archivo fue subido a Cloudinary ─────────────────

  async confirmUpload(authorUserId: string, dto: ConfirmUploadDto): Promise<Evidence> {
    const evidence = await this.findOneAndAssertOwnership(dto.evidenceId, authorUserId);

    this.assertEditable(evidence);

    const session = await this.uploadSessionRepo.findOne({
      where: {
        evidenceId: evidence.id,
        authorUserId,
        consumedAt: IsNull(),
      },
      order: { createdAt: 'DESC' },
    });

    if (!session || session.expiresAt <= new Date()) {
      throw new BadRequestException('La sesión de carga no existe o expiró');
    }

    if (dto.cloudinaryPublicId !== session.expectedPublicId) {
      throw new ForbiddenException('El archivo no corresponde a la sesión de carga autorizada');
    }

    const resourceType = session.resourceType;

    const fileMeta = await this.cloudinaryService.getFileMetadata(
      dto.cloudinaryPublicId,
      resourceType,
    );

    if (
      fileMeta.publicId !== session.expectedPublicId ||
      fileMeta.resourceType !== session.resourceType ||
      fileMeta.bytes > session.maxBytes
    ) {
      throw new BadRequestException(
        'Los metadatos del archivo no coinciden con la sesión autorizada',
      );
    }

    const contentHash = await this.calculateContentHash(fileMeta.secureUrl, session.maxBytes);

    await this.dataSource.transaction(async (manager) => {
      const lockedSession = await manager
        .getRepository(UploadSession)
        .createQueryBuilder('session')
        .setLock('pessimistic_write')
        .where('session.id = :id', { id: session.id })
        .getOne();

      if (!lockedSession || lockedSession.consumedAt || lockedSession.expiresAt <= new Date()) {
        throw new BadRequestException('La sesión de carga ya fue consumida o expiró');
      }

      const lockedEvidence = await manager
        .getRepository(Evidence)
        .createQueryBuilder('evidence')
        .setLock('pessimistic_write')
        .where('evidence.id = :id', { id: evidence.id })
        .getOne();

      if (!lockedEvidence) {
        throw new NotFoundException(`Evidence ${evidence.id} no encontrada`);
      }

      this.assertEditable(lockedEvidence);

      const lastVersion = await manager.getRepository(EvidenceVersion).findOne({
        where: { evidenceId: lockedEvidence.id },
        order: { versionNumber: 'DESC' },
      });
      const nextVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

      lockedEvidence.canonicalUri = fileMeta.secureUrl;
      lockedEvidence.contentHash = contentHash;
      await manager.save(Evidence, lockedEvidence);

      const version = manager.create(EvidenceVersion, {
        evidenceId: lockedEvidence.id,
        versionNumber: nextVersionNumber,
        storageUri: fileMeta.secureUrl,
        contentHash,
        hashAlgorithm: 'sha256',
        cloudinaryPublicId: fileMeta.publicId,
        assetVersion: fileMeta.version,
        providerChecksum: fileMeta.providerChecksum,
        mimeType: lockedSession.mimeType,
        byteSize: fileMeta.bytes,
        changeSummary: dto.changeSummary ?? `Versión ${nextVersionNumber}`,
        isMaterialChange: dto.isMaterialChange ?? nextVersionNumber === 1,
        supersedesVersionNumber: lastVersion?.versionNumber ?? undefined,
        createdByUserId: authorUserId,
      } as EvidenceVersion);

      await manager.save(EvidenceVersion, version);
      lockedSession.consumedAt = new Date();
      await manager.save(UploadSession, lockedSession);
    });

    this.logger.log(
      `Evidence ${evidence.id} actualizada — Cloudinary publicId: ${fileMeta.publicId}`,
    );

    return this.findOne(evidence.id);
  }

  // ─── Enviar a revisión ────────────────────────────────────────────────────────

  async submit(id: string, authorUserId: string): Promise<Evidence> {
    const evidence = await this.findOneAndAssertOwnership(id, authorUserId);

    this.assertEditable(evidence);

    if (!evidence.canonicalUri) {
      throw new BadRequestException(
        'No se puede enviar la evidencia sin haber subido un archivo o definido una URL',
      );
    }

    evidence.status = EvidenceStatus.SUBMITTED;
    evidence.submittedAt = new Date();

    const saved = await this.evidenceRepo.save(evidence);
    this.logger.log(`Evidence ${id} enviada a revisión por usuario ${authorUserId}`);

    return saved;
  }

  // ─── Actualizar (descripción, privacidad, etc.) ───────────────────────────────

  async update(id: string, authorUserId: string, dto: UpdateEvidenceDto): Promise<Evidence> {
    const evidence = await this.findOneAndAssertOwnership(id, authorUserId);

    this.assertEditable(evidence);

    Object.assign(evidence, dto);

    return this.evidenceRepo.save(evidence);
  }

  // ─── Consultas ────────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<Evidence> {
    const evidence = await this.evidenceRepo.findOne({
      where: { id },
      relations: [
        'versions',
        'microActionInstance',
        'author',
        'project',
        'microActionInstance.microActionDefinition',
        'microActionInstance.microActionDefinition.pac',
        'evaluations',
        'evaluations.rubric',
        'evaluations.humanReview',
      ],
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence ${id} no encontrada`);
    }

    return evidence;
  }

  async findOneAuthorized(id: string, principal: ProjectPrincipal): Promise<Evidence> {
    const evidence = await this.findOne(id);
    await this.projectAccessService.assertCanAccessProject(principal, evidence.projectId);
    return evidence;
  }

  async findAllByProject(projectId: string, principal: ProjectPrincipal): Promise<Evidence[]> {
    await this.projectAccessService.assertCanAccessProject(principal, projectId);
    return this.evidenceRepo.find({
      where: { projectId },
      relations: [
        'versions',
        'microActionInstance',
        'microActionInstance.microActionDefinition',
        'microActionInstance.microActionDefinition.pac',
        'evaluations',
        'author',
      ],
      order: { createdAt: 'DESC' },
    });
  }
  async findAllByMicroActionInstance(
    microActionInstanceId: string,
    principal: ProjectPrincipal,
  ): Promise<Evidence[]> {
    const instance = await this.microActionInstanceService.findOne(microActionInstanceId);
    await this.projectAccessService.assertCanAccessProject(principal, instance.projectId);
    return this.evidenceRepo.find({
      where: { microActionInstanceId },
      relations: ['versions'],
      order: { createdAt: 'DESC' },
    });
  }

  async findVersions(evidenceId: string, principal: ProjectPrincipal): Promise<EvidenceVersion[]> {
    await this.findOneAuthorized(evidenceId, principal);

    return this.versionRepo.find({
      where: { evidenceId },
      order: { versionNumber: 'DESC' },
    });
  }

  // ─── Eliminar (solo DRAFT) — patrón outbox ────────────────────────────────────
  // No se borra el archivo de Cloudinary ni la fila local en el mismo paso.
  // Se marca la evidencia como DELETION_PENDING, se encola en el outbox y el
  // borrado real (Cloudinary + fila local) lo completa processOutboxEntry,
  // ya sea en el intento inmediato "best effort" o en la reconciliación cron.

  async remove(id: string, authorUserId: string): Promise<void> {
    const evidence = await this.findOneAndAssertOwnership(id, authorUserId);

    if (evidence.status !== EvidenceStatus.DRAFT) {
      throw new BadRequestException(
        `Solo se puede eliminar una evidencia en estado DRAFT. Estado actual: "${evidence.status}"`,
      );
    }

    if (!evidence.canonicalUri) {
      // Nunca se confirmó un upload: no hay nada externo que limpiar.
      await this.evidenceRepo.remove(evidence);
      this.logger.log(
        `Evidence ${id} eliminada (sin archivo asociado) por usuario ${authorUserId}`,
      );
      return;
    }

    const publicId = this.extractCloudinaryPublicId(evidence.canonicalUri);
    const lastVersion = await this.versionRepo.findOne({
      where: { evidenceId: evidence.id },
      order: { versionNumber: 'DESC' },
    });
    const resourceType = lastVersion?.mimeType
      ? this.cloudinaryService.getResourceType(lastVersion.mimeType)
      : 'raw';

    await this.dataSource.transaction(async (manager) => {
      evidence.status = EvidenceStatus.DELETION_PENDING;
      await manager.save(Evidence, evidence);

      await manager.save(
        EvidenceDeletionOutbox,
        manager.create(EvidenceDeletionOutbox, {
          evidenceId: evidence.id,
          cloudinaryPublicId: publicId,
          resourceType,
          status: DeletionOutboxStatus.PENDING,
          requestedByUserId: authorUserId,
        }),
      );
    });

    this.logger.log(
      `Evidence ${id} marcada DELETION_PENDING por usuario ${authorUserId}; encolada en outbox`,
    );

    // Intento inmediato "best effort": si Cloudinary responde rápido, no
    // dejamos al usuario esperando hasta el próximo ciclo del cron.
    void this.processOutboxEntry(evidence.id).catch((err: unknown) =>
      this.logger.warn(
        `Intento inmediato de borrado falló para evidence ${id}, quedará para reconciliación: ${
          err instanceof Error ? err.message : 'Error desconocido'
        }`,
      ),
    );
  }

  // ─── Reconciliación periódica del outbox de borrado ────────────────────────────

  @Cron(CronExpression.EVERY_5_MINUTES)
  async reconcileDeletions(): Promise<void> {
    const pending = await this.outboxRepo.find({
      where: [{ status: DeletionOutboxStatus.PENDING }, { status: DeletionOutboxStatus.FAILED }],
      order: { createdAt: 'ASC' },
      take: 25,
    });

    for (const entry of pending) {
      if (entry.attempts >= MAX_DELETION_ATTEMPTS) continue;
      await this.processOutboxEntry(entry.evidenceId, entry.id).catch((err: unknown) =>
        this.logger.warn(
          `Reconciliación: fallo en outbox ${entry.id}: ${
            err instanceof Error ? err.message : 'Error desconocido'
          }`,
        ),
      );
    }
  }

  // Procesa una entrada del outbox: borra en Cloudinary y, si tuvo éxito,
  // borra definitivamente la evidencia y sus versiones de la base local.
  async processOutboxEntry(evidenceId: string, outboxId?: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const qb = manager
        .getRepository(EvidenceDeletionOutbox)
        .createQueryBuilder('outbox')
        .setLock('pessimistic_write')
        .where('outbox.evidence_id = :evidenceId', { evidenceId })
        .andWhere('outbox.status IN (:...statuses)', {
          statuses: [DeletionOutboxStatus.PENDING, DeletionOutboxStatus.FAILED],
        });

      if (outboxId) {
        qb.andWhere('outbox.id = :outboxId', { outboxId });
      }

      const entry = await qb.orderBy('outbox.created_at', 'DESC').getOne();
      if (!entry) return; // ya procesada, o no existe

      entry.status = DeletionOutboxStatus.PROCESSING;
      await manager.save(EvidenceDeletionOutbox, entry);

      try {
        if (entry.cloudinaryPublicId) {
          await this.cloudinaryService.deleteFile(
            entry.cloudinaryPublicId,
            entry.resourceType as 'image' | 'video' | 'raw',
          );
        }

        entry.status = DeletionOutboxStatus.COMPLETED;
        entry.processedAt = new Date();
        await manager.save(EvidenceDeletionOutbox, entry);

        await manager.delete(EvidenceVersion, { evidenceId });
        await manager.delete(Evidence, { id: evidenceId });

        this.logger.log(`Evidence ${evidenceId} eliminada definitivamente (outbox ${entry.id})`);
      } catch (error) {
        entry.attempts += 1;
        entry.lastError = error instanceof Error ? error.message : 'Error desconocido';
        entry.status =
          entry.attempts >= MAX_DELETION_ATTEMPTS
            ? DeletionOutboxStatus.FAILED
            : DeletionOutboxStatus.PENDING;
        await manager.save(EvidenceDeletionOutbox, entry);

        this.logger.error(
          `Fallo al eliminar archivo de Cloudinary para evidence ${evidenceId} (intento ${entry.attempts}): ${entry.lastError}`,
        );

        if (entry.status === DeletionOutboxStatus.FAILED) {
          this.logger.error(
            `Evidence ${evidenceId} alcanzó el máximo de reintentos (${MAX_DELETION_ATTEMPTS}). Requiere intervención manual (ADMIN).`,
          );
        }

        throw error;
      }
    });
  }

  // Disparo manual del reintento (para uso administrativo / retest de QA-DATA-005)
  async retryDeletion(
    evidenceId: string,
  ): Promise<{ status: DeletionOutboxStatus; attempts: number }> {
    const entry = await this.outboxRepo.findOne({
      where: { evidenceId },
      order: { createdAt: 'DESC' },
    });

    if (!entry) {
      throw new NotFoundException(`No hay un borrado pendiente para la evidencia ${evidenceId}`);
    }

    if (entry.status === DeletionOutboxStatus.COMPLETED) {
      return { status: entry.status, attempts: entry.attempts };
    }

    await this.processOutboxEntry(evidenceId, entry.id).catch(() => undefined);

    const refreshed = await this.outboxRepo.findOne({ where: { id: entry.id } });
    return { status: refreshed!.status, attempts: refreshed!.attempts };
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────────

  private async findOneAndAssertOwnership(id: string, authorUserId: string): Promise<Evidence> {
    const evidence = await this.findOne(id);

    if (evidence.authorUserId !== authorUserId) {
      throw new ForbiddenException('No tenés permiso para modificar esta evidencia');
    }

    return evidence;
  }

  private assertEditable(evidence: Evidence): void {
    if (!EDITABLE_STATUSES.includes(evidence.status)) {
      throw new BadRequestException(
        `La evidencia no se puede modificar en estado "${evidence.status}"`,
      );
    }
  }

  private async calculateContentHash(secureUrl: string, maxBytes: number): Promise<string> {
    let response: Response;
    try {
      response = await fetch(secureUrl);
    } catch {
      throw new BadRequestException('No se pudo recuperar el archivo para verificar su integridad');
    }

    if (!response.ok) {
      throw new BadRequestException('No se pudo recuperar el archivo para verificar su integridad');
    }

    const declaredLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
      throw new BadRequestException('El archivo supera el tamaño máximo permitido');
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > maxBytes) {
      throw new BadRequestException('El archivo supera el tamaño máximo permitido');
    }

    return crypto.createHash('sha256').update(bytes).digest('hex');
  }

  // Extrae el publicId de una URL de Cloudinary
  // Formato: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{publicId}.{ext}
  private extractCloudinaryPublicId(uri: string): string | null {
    const match = uri.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    return match ? match[1] : null;
  }
}
