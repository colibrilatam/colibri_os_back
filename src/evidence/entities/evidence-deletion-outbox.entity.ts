import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DeletionOutboxStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('evidence_deletion_outbox')
export class EvidenceDeletionOutbox {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'evidence_id' })
  evidenceId: string;

  @Column({ name: 'cloudinary_public_id', type: 'varchar', nullable: true })
  cloudinaryPublicId: string | null;

  @Column({ name: 'resource_type', default: 'raw' })
  resourceType: string;

  @Index()
  @Column({
    type: 'enum',
    enum: DeletionOutboxStatus,
    default: DeletionOutboxStatus.PENDING,
  })
  status: DeletionOutboxStatus;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError: string | null;

  @Column({ name: 'requested_by_user_id' })
  requestedByUserId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date | null;
}
