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
import { MicroActionDefinition } from '../../micro-action-definitions/entities/micro-action-definition.entity';
import { Evidence } from '../../evidence/entities/evidence.entity';

export enum MicroActionInstanceStatus {
  STARTED = 'started',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  VALIDATED = 'validated',
  COMPLETED = 'completed',
  CLOSED = 'closed',
  REOPENED = 'reopened',
}

@Entity('micro_action_instances')
export class MicroActionInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'actor_user_id' })
  actorUserId: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'micro_action_definition_id' })
  microActionDefinitionId: string;

  @Column({
    type: 'enum',
    enum: MicroActionInstanceStatus,
    default: MicroActionInstanceStatus.STARTED,
  })
  status: MicroActionInstanceStatus;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'validated_at', type: 'timestamptz', nullable: true })
  validatedAt: Date | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @Column({ name: 'execution_window_days_snapshot', type: 'int', nullable: true })
  executionWindowDaysSnapshot: number | null;

  @Column({ name: 'is_on_time', type: 'boolean', nullable: true })
  isOnTime: boolean | null;

  @Column({ name: 'attempt_number', default: 1 })
  attemptNumber: number;

  @Column({ name: 'reopened_count', default: 0 })
  reopenedCount: number;

  @Column({ name: 'execution_notes', type: 'text', nullable: true })
  executionNotes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => User, (user) => user.projectMembers)
  @JoinColumn({ name: 'actor_user_id' })
  actor: User;

  @ManyToOne(() => Project, (project) => project.members)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => MicroActionDefinition)
  @JoinColumn({ name: 'micro_action_definition_id' })
  microActionDefinition: MicroActionDefinition;

  @OneToMany(() => Evidence, (evidence) => evidence.microActionInstance)
  evidences: Evidence[];
}