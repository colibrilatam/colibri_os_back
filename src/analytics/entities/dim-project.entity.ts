import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { FactProjectActivity } from './fact-project-activity.entity';
import { FactValidatedEvidence } from './fact-validated-evidence.entity';
import { FactCollaborationImpact } from './fact-collaboration-impact.entity';
import { FactSustainabilitySignal } from './fact-sustainability-signal.entity';
import { FactCompetencySignal } from './fact-competency-signal.entity';
import { FactSkillSignal } from './fact-skill-signal.entity';

@Entity('dim_projects')
export class DimProject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'project_name' })
  projectName: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  industry: string;

  @Column({ nullable: true })
  status: string;

  @Column({ name: 'current_tramo_id', nullable: true })
  currentTramoId: string;

  @Column({ name: 'trajectory_status', nullable: true })
  trajectoryStatus: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relaciones
  @OneToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @OneToMany(() => FactProjectActivity, (f) => f.project)
  projectActivities: FactProjectActivity[];

  @OneToMany(() => FactValidatedEvidence, (f) => f.project)
  validatedEvidences: FactValidatedEvidence[];

  @OneToMany(() => FactCollaborationImpact, (f) => f.project)
  collaborationImpacts: FactCollaborationImpact[];

  @OneToMany(() => FactSustainabilitySignal, (f) => f.project)
  sustainabilitySignals: FactSustainabilitySignal[];

  @OneToMany(() => FactCompetencySignal, (f) => f.project)
  competencySignals: FactCompetencySignal[];

  @OneToMany(() => FactSkillSignal, (f) => f.project)
  skillSignals: FactSkillSignal[];
}