import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import { MicroActionInstance } from './micro-action-instance.entity';
import { EvidenceVersion } from './evidence-version.entity';
import { Evaluation } from '../../evaluation/entities/evaluation.entity';
import { EvidenceType } from '../../curriculum/entities/micro-action-definition.entity';

export enum EvidenceStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ValidationStatus {
  PENDING = 'pending',
  AI_REVIEWED = 'ai_reviewed',
  HUMAN_REVIEWED = 'human_reviewed',
  VALIDATED = 'validated',
  REJECTED = 'rejected',
}

export enum ValidationConfidence {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum PrivacyLevel {
  PUBLIC = 'public',
  PRIVATE = 'private',
  RESTRICTED = 'restricted',
}

@Entity('evidences')
export class Evidence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'micro_action_instance_id' })
  microActionInstanceId: string;

  @Column({ name: 'author_user_id' })
  authorUserId: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({
    name: 'evidence_type',
    type: 'enum',
    enum: EvidenceType,
  })
  evidenceType: EvidenceType;

  @Column({
    type: 'enum',
    enum: EvidenceStatus,
    default: EvidenceStatus.DRAFT,
  })
  status: EvidenceStatus;

  @Column({
    name: 'validation_status',
    type: 'enum',
    enum: ValidationStatus,
    default: ValidationStatus.PENDING,
  })
  validationStatus: ValidationStatus;

  @Column({ name: 'is_valid_for_ic', default: false })
  isValidForIc: boolean;

  @Column({
    name: 'validation_confidence',
    type: 'enum',
    enum: ValidationConfidence,
    nullable: true,
  })
  validationConfidence: ValidationConfidence;

  @Column({
    name: 'privacy_level',
    type: 'enum',
    enum: PrivacyLevel,
    default: PrivacyLevel.PRIVATE,
  })
  privacyLevel: PrivacyLevel;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'canonical_uri', nullable: true })
  canonicalUri: string;

  @Column({ name: 'content_hash', nullable: true })
  contentHash: string;

  @Column({ name: 'validated_by_user_id', nullable: true })
  validatedByUserId: string;

  @Column({ name: 'validation_notes', type: 'text', nullable: true })
  validationNotes: string;

  @Column({ name: 'public_signal_enabled', default: false })
  publicSignalEnabled: boolean;

  @Column({ name: 'submitted_at', nullable: true })
  submittedAt: Date;

  @Column({ name: 'approved_at', nullable: true })
  approvedAt: Date;

  @Column({ name: 'rejected_at', nullable: true })
  rejectedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => MicroActionInstance, (mai) => mai.evidences)
  @JoinColumn({ name: 'micro_action_instance_id' })
  microActionInstance: MicroActionInstance;

  @ManyToOne(() => User, (user) => user.projects)
  @JoinColumn({ name: 'author_user_id' })
  author: User;

  @ManyToOne(() => Project, (project) => project.members)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'validated_by_user_id' })
  validatedBy: User;

  @OneToMany(() => EvidenceVersion, (ev) => ev.evidence, { cascade: true })
  versions: EvidenceVersion[];

  @OneToMany(() => Evaluation, (evaluation) => evaluation.evidence)
  evaluations: Evaluation[];
}