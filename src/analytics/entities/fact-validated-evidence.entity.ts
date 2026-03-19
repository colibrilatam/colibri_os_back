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

@Entity('fact_validated_evidences')
export class FactValidatedEvidence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'tramo_id' })
  tramoId: string;

  @Column({ name: 'period_start' })
  periodStart: Date;

  @Column({ name: 'period_end' })
  periodEnd: Date;

  @Column({ name: 'validated_evidence_count', default: 0 })
  validatedEvidenceCount: number;

  @Column({ name: 'rejected_evidence_count', default: 0 })
  rejectedEvidenceCount: number;

  @Column({ name: 'pending_evidence_count', default: 0 })
  pendingEvidenceCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => DimProject, (dp) => dp.validatedEvidences)
  @JoinColumn({ name: 'project_id' })
  project: DimProject;

  @ManyToOne(() => DimTramo, (dt) => dt.validatedEvidences)
  @JoinColumn({ name: 'tramo_id' })
  tramo: DimTramo;
}