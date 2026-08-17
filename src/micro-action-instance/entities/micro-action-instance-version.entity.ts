// src/micro-action-instance/entities/micro-action-instance-version.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { MicroActionInstance } from './micro-action-instance.entity';
import { MicroActionInstanceStatus } from './micro-action-instance-status.enum';
import { User } from '../../users/entities/user.entity';

export enum MicroActionInstanceChangeType {
  CREATED = 'created',
  STATUS_CHANGE = 'status_change',
  NOTES_UPDATE = 'notes_update',
  SUBMITTED = 'submitted',
  REOPENED = 'reopened',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

@Entity('micro_action_instance_versions')
@Unique(['microActionInstanceId', 'versionNumber'])
export class MicroActionInstanceVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'micro_action_instance_id', type: 'uuid' })
  microActionInstanceId: string;

  @Column({ name: 'version_number', type: 'int' })
  versionNumber: number;

  @Column({
    name: 'change_type',
    type: 'enum',
    enum: MicroActionInstanceChangeType,
  })
  changeType: MicroActionInstanceChangeType;

  @Column({
    type: 'enum',
    enum: MicroActionInstanceStatus,
  })
  status: MicroActionInstanceStatus;

  @Column({
    name: 'previous_status',
    type: 'enum',
    enum: MicroActionInstanceStatus,
    nullable: true,
  })
  previousStatus: MicroActionInstanceStatus | null;

  @Column({ name: 'execution_notes', type: 'text', nullable: true })
  executionNotes: string | null;

  @Column({ name: 'attempt_number', type: 'int' })
  attemptNumber: number;

  @Column({ name: 'reopened_count', type: 'int' })
  reopenedCount: number;

  @Column({ name: 'change_summary', type: 'text', nullable: true })
  changeSummary: string | null;

  @Column({ name: 'supersedes_version_number', type: 'int', nullable: true })
  supersedesVersionNumber: number | null;

  @Column({ name: 'canonical_uri', type: 'text', nullable: true })
  canonicalUri: string | null;

  @Column({ name: 'created_by_user_id', type: 'uuid' })
  createdByUserId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => MicroActionInstance, (instance) => instance.versions)
  @JoinColumn({ name: 'micro_action_instance_id' })
  microActionInstance: MicroActionInstance;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy: User;
}