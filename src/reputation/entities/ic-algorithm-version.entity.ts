import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ReputationIndexSnapshot } from './reputation-index-snapshot.entity';

@Entity('ic_algorithm_versions')
export class IcAlgorithmVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    name: 'weight_action',
    type: 'numeric',
    precision: 5,
    scale: 2,
  })
  weightAction: number;

  @Column({
    name: 'weight_evidence',
    type: 'numeric',
    precision: 5,
    scale: 2,
  })
  weightEvidence: number;

  @Column({
    name: 'weight_consistency',
    type: 'numeric',
    precision: 5,
    scale: 2,
  })
  weightConsistency: number;

  @Column({
    name: 'weight_collaboration',
    type: 'numeric',
    precision: 5,
    scale: 2,
  })
  weightCollaboration: number;

  @Column({
    name: 'weight_sustainability',
    type: 'numeric',
    precision: 5,
    scale: 2,
  })
  weightSustainability: number;

  @Column({ name: 'consistency_formula_json', type: 'jsonb', nullable: true })
  consistencyFormulaJson: object;

  @Column({ name: 'collaboration_formula_json', type: 'jsonb', nullable: true })
  collaborationFormulaJson: object;

  @Column({ name: 'sustainability_rubric_version', nullable: true })
  sustainabilityRubricVersion: string;

  @Column({ name: 'effective_from' })
  effectiveFrom: Date;

  @Column({ name: 'effective_to', nullable: true })
  effectiveTo: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relaciones
  @OneToMany(() => ReputationIndexSnapshot, (snapshot) => snapshot.algorithmVersion)
  snapshots: ReputationIndexSnapshot[];
}