import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DimProject } from './dim-project.entity';

@Entity('fact_collaboration_impacts')
export class FactCollaborationImpact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'period_start' })
  periodStart: Date;

  @Column({ name: 'period_end' })
  periodEnd: Date;

  @Column({ name: 'verified_collaboration_count', default: 0 })
  verifiedCollaborationCount: number;

  @Column({
    name: 'weighted_collaboration_score',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  weightedCollaborationScore: number;

  @Column({ name: 'unique_collaborators_count', default: 0 })
  uniqueCollaboratorsCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => DimProject, (dp) => dp.collaborationImpacts)
  @JoinColumn({ name: 'project_id' })
  project: DimProject;
}