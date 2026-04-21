// src/digital-credentials/entities/digital-credential.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { Evidence } from '../../evidence/entities/evidence.entity';
import { Evaluation } from '../../evaluation/entities/evaluation.entity';

export enum CredentialType {
  EVIDENCE_APPROVED = 'evidence_approved',
}

export enum CredentialStatus {
  ISSUED = 'issued',
  REVOKED = 'revoked',
}

@Entity('digital_credentials')
export class DigitalCredential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'evidence_id' })
  evidenceId: string;

  @Column({ name: 'evaluation_id' })
  evaluationId: string;

  @Column({
    name: 'credential_type',
    type: 'enum',
    enum: CredentialType,
    default: CredentialType.EVIDENCE_APPROVED,
  })
  credentialType: CredentialType;

  @Column({
    type: 'enum',
    enum: CredentialStatus,
    default: CredentialStatus.ISSUED,
  })
  status: CredentialStatus;

  @Column({ name: 'credential_hash', type: 'varchar', nullable: true })
  credentialHash: string | null;

  @Column({ name: 'issued_at', type: 'timestamptz' })
  issuedAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  @Column({ name: 'revoked_reason', type: 'text', nullable: true })
  revokedReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Evidence)
  @JoinColumn({ name: 'evidence_id' })
  evidence: Evidence;

  @ManyToOne(() => Evaluation)
  @JoinColumn({ name: 'evaluation_id' })
  evaluation: Evaluation;
}