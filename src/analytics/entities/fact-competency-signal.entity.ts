import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DimProject } from './dim-project.entity';
import { DimUser } from './dim-user.entity';
import { Evidence } from '../../evidence/entities/evidence.entity';
import { CompetencyLevel } from './analytics.enums';

export { CompetencyLevel };

@Entity('fact_competency_signals')
export class FactCompetencySignal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'competency_area_code', nullable: true })
  competencyAreaCode: string;

  @Column({ name: 'competency_code' })
  competencyCode: string;

  @Column({ type: 'enum', enum: CompetencyLevel })
  level: CompetencyLevel;

  @Column({
    name: 'signal_strength',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  signalStrength: number;

  @Column({ name: 'source_evidence_id', nullable: true })
  sourceEvidenceId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => DimProject, (dp) => dp.competencySignals)
  @JoinColumn({ name: 'project_id' })
  project: DimProject;

  @ManyToOne(() => DimUser, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: DimUser;

  @ManyToOne(() => Evidence, { nullable: true })
  @JoinColumn({ name: 'source_evidence_id' })
  sourceEvidence: Evidence;
}