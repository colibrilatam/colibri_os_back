// src/evidence/evidence.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { Evidence, EvidenceStatus, PrivacyLevel } from './entities/evidence.entity';
import { EvidenceVersion } from './entities/evidence-version.entity';
import { GoogleDriveService } from '../google-drive/google-drive.service';
import { MicroActionInstanceService } from '../micro-action-instance/micro-action-instance.service';
import { MicroActionInstanceStatus } from '../micro-action-instance/entities/micro-action-instance.entity';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { UpdateEvidenceDto } from './dto/update-evidence.dto';
import { RequestUploadUrlDto } from './dto/request-upload-url.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';

// Estados desde los cuales se puede modificar la evidencia
const EDITABLE_STATUSES: EvidenceStatus[] = [
  EvidenceStatus.DRAFT,
  EvidenceStatus.REJECTED,
];

@Injectable()
export class EvidenceService {
  private readonly logger = new Logger(EvidenceService.name);

  constructor(
    @InjectRepository(Evidence)
    private readonly evidenceRepo: Repository<Evidence>,

    @InjectRepository(EvidenceVersion)
    private readonly versionRepo: Repository<EvidenceVersion>,

    private readonly googleDriveService: GoogleDriveService,
    private readonly microActionInstanceService: MicroActionInstanceService,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Crear evidencia (comienza en DRAFT) ──────────────────────────────────────

  async create(
    authorUserId: string,
    dto: CreateEvidenceDto,
  ): Promise<Evidence> {
    // Validamos que la MicroActionInstance exista y pertenezca al usuario
    const instance = await this.microActionInstanceService.findOne(
      dto.microActionInstanceId,
    );

    if (instance.actorUserId !== authorUserId) {
      throw new ForbiddenException(
        'No tenés permiso para crear evidencia en esta microacción',
      );
    }

    // Verificamos que la instancia esté en un estado que acepte evidencia
    const validInstanceStatuses: MicroActionInstanceStatus[] = [
      MicroActionInstanceStatus.STARTED,
      MicroActionInstanceStatus.IN_PROGRESS,
      MicroActionInstanceStatus.REOPENED,
    ];

    if (!validInstanceStatuses.includes(instance.status)) {
      throw new BadRequestException(
        `No se puede crear evidencia para una microacción en estado "${instance.status}"`,
      );
    }

    // Verificamos que no haya ya una evidencia activa (no rechazada) para esta instancia
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

    // FIX: cast explícito para evitar ambigüedad de overload en repo.create()
    const evidence = this.evidenceRepo.create({
      microActionInstanceId: dto.microActionInstanceId,
      authorUserId,
      projectId: dto.projectId,
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

  // ─── Solicitar URL de subida a Google Drive ───────────────────────────────────

  async requestUploadUrl(
    authorUserId: string,
    dto: RequestUploadUrlDto,
  ): Promise<{ uploadUrl: string; driveFileName: string }> {
    const evidence = await this.findOneAndAssertOwnership(
      dto.evidenceId,
      authorUserId,
    );

    this.assertEditable(evidence);

    const session = await this.googleDriveService.generateResumableUploadUrl(
      dto.fileName,
      dto.mimeType,
      evidence.projectId,
      evidence.id,
    );

    this.logger.log(
      `URL de upload generada para evidence ${evidence.id} — archivo: ${dto.fileName}`,
    );

    return {
      uploadUrl: session.uploadUrl,
      driveFileName: session.driveFileName,
    };
  }

  // ─── Confirmar subida: guarda storageUri y crea EvidenceVersion ───────────────

  async confirmUpload(
    authorUserId: string,
    dto: ConfirmUploadDto,
  ): Promise<Evidence> {
    const evidence = await this.findOneAndAssertOwnership(
      dto.evidenceId,
      authorUserId,
    );

    this.assertEditable(evidence);

    // Verificamos que el archivo realmente existe en Drive
    const fileMeta = await this.googleDriveService.getFileMetadata(
      dto.driveFileId,
    );

    // Hacemos el archivo accesible si la evidencia es pública
    if (evidence.privacyLevel === PrivacyLevel.PUBLIC) {
      await this.googleDriveService.makeFileAccessible(dto.driveFileId);
    }

    // Calculamos el número de versión
    const lastVersion = await this.versionRepo.findOne({
      where: { evidenceId: evidence.id },
      order: { versionNumber: 'DESC' },
    });

    const nextVersionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

    // Generamos hash del storageUri para trazabilidad
    const contentHash = crypto
      .createHash('sha256')
      .update(dto.storageUri)
      .digest('hex');

    // Usamos una transacción para que evidence y version se guarden juntos
    await this.dataSource.transaction(async (manager) => {
      // Actualizamos la evidence
      evidence.canonicalUri = dto.storageUri;
      evidence.contentHash = contentHash;
      await manager.save(Evidence, evidence);

      // FIX: usamos undefined en vez de null para supersedesVersionNumber
      // porque la entidad EvidenceVersion lo tiene como number | null
      // y TypeORM acepta undefined como "no enviar el campo"
      const version = manager.create(EvidenceVersion, {
        evidenceId: evidence.id,
        versionNumber: nextVersionNumber,
        storageUri: dto.storageUri,
        contentHash,
        changeSummary: dto.changeSummary ?? `Versión ${nextVersionNumber}`,
        isMaterialChange: dto.isMaterialChange ?? nextVersionNumber === 1,
        supersedesVersionNumber: lastVersion?.versionNumber ?? undefined,
        createdByUserId: authorUserId,
      } as EvidenceVersion);

      await manager.save(EvidenceVersion, version);
    });

    this.logger.log(
      `Evidence ${evidence.id} actualizada con archivo Drive ${fileMeta.fileId} — versión ${nextVersionNumber}`,
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

  // ─── Update (descripción, privacidad, etc.) ───────────────────────────────────

  async update(
    id: string,
    authorUserId: string,
    dto: UpdateEvidenceDto,
  ): Promise<Evidence> {
    const evidence = await this.findOneAndAssertOwnership(id, authorUserId);

    this.assertEditable(evidence);

    // Si cambia la privacidad a PUBLIC y hay archivo, lo hacemos accesible
    if (
      dto.privacyLevel === PrivacyLevel.PUBLIC &&
      evidence.privacyLevel !== PrivacyLevel.PUBLIC &&
      evidence.canonicalUri
    ) {
      const fileId = this.extractDriveFileId(evidence.canonicalUri);
      if (fileId) {
        await this.googleDriveService.makeFileAccessible(fileId);
      }
    }

    // Si cambia de PUBLIC a PRIVATE, revocamos acceso
    if (
      dto.privacyLevel === PrivacyLevel.PRIVATE &&
      evidence.privacyLevel === PrivacyLevel.PUBLIC &&
      evidence.canonicalUri
    ) {
      const fileId = this.extractDriveFileId(evidence.canonicalUri);
      if (fileId) {
        await this.googleDriveService.revokePublicAccess(fileId);
      }
    }

    Object.assign(evidence, dto);

    return this.evidenceRepo.save(evidence);
  }

  // ─── Consultas ────────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<Evidence> {
    const evidence = await this.evidenceRepo.findOne({
      where: { id },
      relations: ['versions', 'microActionInstance', 'author'],
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence ${id} no encontrada`);
    }

    return evidence;
  }

  async findAllByProject(projectId: string): Promise<Evidence[]> {
    return this.evidenceRepo.find({
      where: { projectId },
      relations: ['versions', 'microActionInstance'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllByMicroActionInstance(
    microActionInstanceId: string,
  ): Promise<Evidence[]> {
    return this.evidenceRepo.find({
      where: { microActionInstanceId },
      relations: ['versions'],
      order: { createdAt: 'DESC' },
    });
  }

  async findVersions(evidenceId: string): Promise<EvidenceVersion[]> {
    await this.findOne(evidenceId); // valida que exista

    return this.versionRepo.find({
      where: { evidenceId },
      order: { versionNumber: 'DESC' },
    });
  }

  // ─── Eliminar (solo DRAFT) ────────────────────────────────────────────────────

  async remove(id: string, authorUserId: string): Promise<void> {
    const evidence = await this.findOneAndAssertOwnership(id, authorUserId);

    if (evidence.status !== EvidenceStatus.DRAFT) {
      throw new BadRequestException(
        `Solo se puede eliminar una evidencia en estado DRAFT. Estado actual: "${evidence.status}"`,
      );
    }

    // Si tiene archivo en Drive, lo eliminamos también
    if (evidence.canonicalUri) {
      const fileId = this.extractDriveFileId(evidence.canonicalUri);
      if (fileId) {
        await this.googleDriveService.deleteFile(fileId).catch((err) => {
          // No bloqueamos el borrado de la evidencia si falla Drive
          this.logger.warn(
            `No se pudo eliminar el archivo de Drive para evidence ${id}: ${err.message}`,
          );
        });
      }
    }

    await this.evidenceRepo.remove(evidence);
    this.logger.log(`Evidence ${id} eliminada por usuario ${authorUserId}`);
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────────

  private async findOneAndAssertOwnership(
    id: string,
    authorUserId: string,
  ): Promise<Evidence> {
    const evidence = await this.findOne(id);

    if (evidence.authorUserId !== authorUserId) {
      throw new ForbiddenException(
        'No tenés permiso para modificar esta evidencia',
      );
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

  // Extrae el fileId de una URL de Google Drive
  // Formatos: /file/d/{fileId}/view  o  ?id={fileId}
  private extractDriveFileId(uri: string): string | null {
    const matchPath = uri.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchPath) return matchPath[1];

    const matchQuery = uri.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchQuery) return matchQuery[1];

    return null;
  }
}