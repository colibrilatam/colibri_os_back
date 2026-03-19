import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DimProject } from './dim-project.entity';
import { DimTramo } from './dim-tramo.entity';
import { DimPac } from './dim-pac.entity';

@Entity('fact_project_activities')
export class FactProjectActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'tramo_id' })
  tramoId: string;

  @Column({ name: 'pac_id', nullable: true })
  pacId: string;

  @Column({ name: 'period_start' })
  periodStart: Date;

  @Column({ name: 'period_end' })
  periodEnd: Date;

  @Column({ name: 'total_micro_actions', default: 0 })
  totalMicroActions: number;

  @Column({ name: 'completed_micro_actions', default: 0 })
  completedMicroActions: number;

  @Column({ name: 'valid_micro_actions', default: 0 })
  validMicroActions: number;

  @Column({ name: 'late_micro_actions', default: 0 })
  lateMicroActions: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => DimProject, (dp) => dp.projectActivities)
  @JoinColumn({ name: 'project_id' })
  project: DimProject;

  @ManyToOne(() => DimTramo, (dt) => dt.projectActivities)
  @JoinColumn({ name: 'tramo_id' })
  tramo: DimTramo;

  @ManyToOne(() => DimPac, { nullable: true })
  @JoinColumn({ name: 'pac_id' })
  pac: DimPac;
}