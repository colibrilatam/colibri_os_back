// src/digital-credentials/digital-credentials.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import {
  DigitalCredential,
  CredentialType,
  CredentialStatus,
} from './entities/digital-credential.entity';

@Injectable()
export class DigitalCredentialsService {
  private readonly logger = new Logger(DigitalCredentialsService.name);

  constructor(
    @InjectRepository(DigitalCredential)
    private readonly credentialRepo: Repository<DigitalCredential>,
  ) {}

  // Llamado internamente desde EvaluationService al aprobar una evidencia
  async issueForApprovedEvidence(params: {
    projectId: string;
    userId: string;
    evidenceId: string;
    evaluationId: string;
  }): Promise<DigitalCredential> {
    // Idempotencia: no emitir dos veces para la misma evidencia
    const existing = await this.credentialRepo.findOne({
      where: {
        evidenceId: params.evidenceId,
        credentialType: CredentialType.EVIDENCE_APPROVED,
        status: CredentialStatus.ISSUED,
      },
    });

    if (existing) {
      this.logger.warn(
        `Credencial ya emitida para evidence ${params.evidenceId} — se omite emisión duplicada`,
      );
      return existing;
    }

    const credentialHash = crypto
      .createHash('sha256')
      .update(`${params.evidenceId}:${params.evaluationId}:${Date.now()}`)
      .digest('hex');

    const credential = this.credentialRepo.create({
      projectId: params.projectId,
      userId: params.userId,
      evidenceId: params.evidenceId,
      evaluationId: params.evaluationId,
      credentialType: CredentialType.EVIDENCE_APPROVED,
      status: CredentialStatus.ISSUED,
      credentialHash,
      issuedAt: new Date(),
    } as DigitalCredential);

    const saved = await this.credentialRepo.save(credential);

    this.logger.log(
      `Credencial digital emitida — evidence: ${params.evidenceId} — usuario: ${params.userId}`,
    );

    return saved;
  }

  async findAllByProject(projectId: string): Promise<DigitalCredential[]> {
    return this.credentialRepo.find({
      where: { projectId },
      relations: ['evidence', 'evaluation'],
      order: { issuedAt: 'DESC' },
    });
  }

  async findAllByUser(userId: string): Promise<DigitalCredential[]> {
    return this.credentialRepo.find({
      where: { userId },
      relations: ['evidence', 'evaluation'],
      order: { issuedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<DigitalCredential> {
    const credential = await this.credentialRepo.findOne({
      where: { id },
      relations: ['evidence', 'evaluation', 'user', 'project'],
    });

    if (!credential) {
      throw new NotFoundException(`Credencial ${id} no encontrada`);
    }

    return credential;
  }

  async revoke(id: string, reason: string): Promise<DigitalCredential> {
    const credential = await this.findOne(id);

    if (credential.status === CredentialStatus.REVOKED) {
      throw new BadRequestException('La credencial ya está revocada');
    }

    credential.status = CredentialStatus.REVOKED;
    credential.revokedAt = new Date();
    credential.revokedReason = reason;

    return this.credentialRepo.save(credential);
  }
}