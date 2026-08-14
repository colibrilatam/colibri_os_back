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
import { MicroActionInstance, MicroActionInstanceStatus } from './micro-action-instance.entity';
import { User } from '../../users/entities/user.entity';

export enum MicroActionInstanceChangeType {
  CREATED = 'created',
  STATUS_CHANGE = 'status_change',
  NOTES_UPDATE = 'notes_update',
  SUBMITTED = 'submitted',
  REOPENED = 'reopened',
}

@Entity('micro_action_instance_versions')
@Unique(['microActionInstanceId', 'versionNumber'])
export class MicroActionInstanceVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'micro_action_instance_id' })
  microActionInstanceId: string;

  @Column({ name: 'version_number' })
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

  @Column({ name: 'attempt_number' })
  attemptNumber: number;

  @Column({ name: 'reopened_count' })
  reopenedCount: number;

  @Column({ name: 'change_summary', type: 'text', nullable: true })
  changeSummary: string | null;

  @Column({ name: 'supersedes_version_number', type: 'int', nullable: true })
  supersedesVersionNumber: number | null;

  @Column({ name: 'created_by_user_id' })
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