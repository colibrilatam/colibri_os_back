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
import { MicroActionDefinition } from '../../curriculum/entities/micro-action-definition.entity';
import { Evidence } from './evidence.entity';

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

  @Column({ name: 'started_at', nullable: true })
  startedAt: Date;

  @Column({ name: 'submitted_at', nullable: true })
  submittedAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ name: 'validated_at', nullable: true })
  validatedAt: Date;

  @Column({ name: 'closed_at', nullable: true })
  closedAt: Date;

  @Column({ name: 'execution_window_days_snapshot', nullable: true })
  executionWindowDaysSnapshot: number;

  @Column({ name: 'is_on_time', nullable: true })
  isOnTime: boolean;

  @Column({ name: 'attempt_number', default: 1 })
  attemptNumber: number;

  @Column({ name: 'reopened_count', default: 0 })
  reopenedCount: number;

  @Column({ name: 'execution_notes', type: 'text', nullable: true })
  executionNotes: string;

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