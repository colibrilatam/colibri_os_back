import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

@Entity('project_profiles')
export class ProjectProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'long_description', type: 'text', nullable: true })
  longDescription: string;

  @Column({ name: 'problem_statement', type: 'text', nullable: true })
  problemStatement: string;

  @Column({ name: 'solution_statement', type: 'text', nullable: true })
  solutionStatement: string;

  @Column({ name: 'target_audience', type: 'text', nullable: true })
  targetAudience: string;

  @Column({ name: 'sdg_goals', type: 'simple-array', nullable: true })
  sdgGoals: string[];

  @Column({ name: 'value_proposition', type: 'text', nullable: true })
  valueProposition: string;

  @Column({ name: 'business_model_summary', type: 'text', nullable: true })
  businessModelSummary: string;

  @Column({ name: 'stage_notes', type: 'text', nullable: true })
  stageNotes: string;

  @Column({ name: 'pitch_url', nullable: true })
  pitchUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Project, (project) => project.profile)
  @JoinColumn({ name: 'project_id' })
  project: Project;
}