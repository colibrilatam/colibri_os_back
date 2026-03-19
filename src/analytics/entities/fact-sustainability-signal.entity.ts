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

@Entity('fact_sustainability_signals')
export class FactSustainabilitySignal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'tramo_id' })
  tramoId: string;

  @Column({ name: 'rubric_version' })
  rubricVersion: string;

  @Column({
    name: 'sustainability_score_raw',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  sustainabilityScoreRaw: number;

  @Column({
    name: 'sustainability_score_normalized',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  sustainabilityScoreNormalized: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => DimProject, (dp) => dp.sustainabilitySignals)
  @JoinColumn({ name: 'project_id' })
  project: DimProject;

  @ManyToOne(() => DimTramo, (dt) => dt.sustainabilitySignals)
  @JoinColumn({ name: 'tramo_id' })
  tramo: DimTramo;
}