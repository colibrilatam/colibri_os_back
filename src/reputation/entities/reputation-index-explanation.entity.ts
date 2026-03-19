import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ReputationIndexSnapshot } from './reputation-index-snapshot.entity';

@Entity('reputation_index_explanations')
export class ReputationIndexExplanation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'snapshot_id' })
  snapshotId: string;

  @Column({ name: 'metric_key' })
  metricKey: string;

  @Column({ name: 'source_entity' })
  sourceEntity: string;

  @Column({ name: 'source_entity_id' })
  sourceEntityId: string;

  @Column({
    name: 'contribution_value',
    type: 'numeric',
    precision: 8,
    scale: 4,
    nullable: true,
  })
  contributionValue: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => ReputationIndexSnapshot, (snapshot) => snapshot.explanations)
  @JoinColumn({ name: 'snapshot_id' })
  snapshot: ReputationIndexSnapshot;
}