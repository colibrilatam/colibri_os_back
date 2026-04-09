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
import {
  Evidence,
  EvidenceStatus,
  PrivacyLevel,
} from './entities/evidence.entity';
import { EvidenceVersion } from './entities/evidence-version.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { MicroActionInstanceService } from '../micro-action-instance/micro-action-instance.service';
import { MicroActionInstanceStatus } from '../micro-action-instance/entities/micro-action-instance.entity';
import { CreateEvidenceDto } from './dto/create-evidence.dto';
import { UpdateEvidenceDto } from './dto/update-evidence.dto';
import { RequestUploadSignatureDto } from './dto/request-upload-signature.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { CloudinarySignature } from '../cloudinary/cloudinary.service';

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

    private readonly cloudinaryService: CloudinaryService,
    private readonly microActionInstanceService: MicroActionInstanceService,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Crear evidencia en DRAFT ─────────────────────────────────────────────────

  async create(
    authorUserId: string,
    dto: CreateEvidenceDto,
  ): Promise<Evidence> {
    const instance = await this.microActionInstanceService.findOne(
      dto.microActionInstanceId,
    );

    if (instance.actorUserId !== authorUserId) {
      throw new ForbiddenException(
        'No tenés permiso para crear evidencia en esta microacción',
      );
    }

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
      projectId: dto.projectId,
      evidenceType: dto.evidenceType,
      description: dto.description ?? null,
      canonicalUri: dto.canonicalUri ?? null,
      privacyLevel: dto.privacyLevel ?? PrivacyLevel.PRIVATE,
      publicSignalEnabled: dto.publicSignalEnabled ?? false,
      status: EvidenceStatus.DRAFT,
    } as Evidence);

    const saved = await this.evidenceRepo.save(evidence);
    this.logger.log(
      `Evidence ${saved.id} creada en DRAFT por usuario ${authorUserId}`,
    );

    return saved;
  }

  // ─── Paso 1: Generar firma para upload directo a Cloudinary ───────────────────
  // El frontend recibe la firma y sube el archivo DIRECTO a Cloudinary
  // sin que el archivo pase por nuestro backend

  async requestUploadSignature(
    authorUserId: string,
    dto: RequestUploadSignatureDto,
  ): Promise<CloudinarySignature> {
    const evidence = await this.findOneAndAssertOwnership(
      dto.evidenceId,
      authorUserId,
    );

    this.assertEditable(evidence);

    const signature = this.cloudinaryService.generateUploadSignature(
      evidence.projectId,
      evidence.id,
      dto.mimeType,
    );

    this.logger.log(
      `Firma de upload generada para evidence ${evidence.id}`,
    );

    return signature;
  }

  // ─── Paso 2: Confirmar que el archivo fue subido a Cloudinary ─────────────────
  // El frontend avisa que el upload terminó y nos pasa el publicId y la URL

  async confirmUpload(
    authorUserId: string,
    dto: ConfirmUploadDto,
  ): Promise<Evidence> {
    const evidence = await this.findOneAndAssertOwnership(
      dto.evidenceId,
      authorUserId,
    );

    this.assertEditable(evidence);

    // Determinamos el resourceType según el mimeType
    const resourceType = this.cloudinaryService.getResourceType(dto.mimeType);

    // Verificamos que el archivo realmente existe en Cloudinary
    const fileMeta = await this.cloudinaryService.getFileMetadata(
      dto.cloudinaryPublicId,
      resourceType,
    );

    // Calculamos el número de versión
    const lastVersion = await this.versionRepo.findOne({
      where: { evidenceId: evidence.id },
      order: { versionNumber: 'DESC' },
    });

    const nextVersionNumber = lastVersion
      ? lastVersion.versionNumber + 1
      : 1;

    // Hash del storageUri para trazabilidad
    const contentHash = crypto
      .createHash('sha256')
      .update(dto.storageUri)
      .digest('hex');

    await this.dataSource.transaction(async (manager) => {
      evidence.canonicalUri = fileMeta.secureUrl;
      evidence.contentHash = contentHash;
      await manager.save(Evidence, evidence);

      const version = manager.create(EvidenceVersion, {
        evidenceId: evidence.id,
        versionNumber: nextVersionNumber,
        storageUri: fileMeta.secureUrl,
        contentHash,
        changeSummary: dto.changeSummary ?? `Versión ${nextVersionNumber}`,
        isMaterialChange: dto.isMaterialChange ?? nextVersionNumber === 1,
        supersedesVersionNumber: lastVersion?.versionNumber ?? undefined,
        createdByUserId: authorUserId,
      } as EvidenceVersion);

      await manager.save(EvidenceVersion, version);
    });

    this.logger.log(
      `Evidence ${evidence.id} actualizada — Cloudinary publicId: ${fileMeta.publicId} — versión ${nextVersionNumber}`,
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
    this.logger.log(
      `Evidence ${id} enviada a revisión por usuario ${authorUserId}`,
    );

    return saved;
  }

  // ─── Actualizar (descripción, privacidad, etc.) ───────────────────────────────

  async update(
    id: string,
    authorUserId: string,
    dto: UpdateEvidenceDto,
  ): Promise<Evidence> {
    const evidence = await this.findOneAndAssertOwnership(id, authorUserId);

    this.assertEditable(evidence);

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
    await this.findOne(evidenceId);

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

    // Si tiene archivo en Cloudinary, lo eliminamos también
    if (evidence.canonicalUri) {
      const publicId = this.extractCloudinaryPublicId(evidence.canonicalUri);
      if (publicId) {
        await this.cloudinaryService.deleteFile(publicId).catch((err) => {
          this.logger.warn(
            `No se pudo eliminar el archivo de Cloudinary para evidence ${id}: ${err.message}`,
          );
        });
      }
    }

    await this.evidenceRepo.remove(evidence);
    this.logger.log(
      `Evidence ${id} eliminada por usuario ${authorUserId}`,
    );
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

  // Extrae el publicId de una URL de Cloudinary
  // Formato: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{publicId}.{ext}
  private extractCloudinaryPublicId(uri: string): string | null {
    const match = uri.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    return match ? match[1] : null;
  }
}