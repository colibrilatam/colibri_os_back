import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';
import { Tramo } from '../../curriculum/entities/tramo.entity';
import { IcAlgorithmVersion } from './ic-algorithm-version.entity';
import { ReputationIndexExplanation } from './reputation-index-explanation.entity';

export enum EligibilityStatus {
  ELIGIBLE = 'eligible',
  NOT_ELIGIBLE = 'not_eligible',
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
}

@Entity('reputation_index_snapshots')
export class ReputationIndexSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', nullable: true })
  projectId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'tramo_id', nullable: true })
  tramoId: string;

  @Column({ name: 'algorithm_version_id' })
  algorithmVersionId: string;

  @Column({
    name: 'action_score',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  actionScore: number;

  @Column({
    name: 'evidence_score',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  evidenceScore: number;

  @Column({
    name: 'consistency_score',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  consistencyScore: number;

  @Column({
    name: 'collaboration_score',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  collaborationScore: number;

  @Column({
    name: 'sustainability_score',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  sustainabilityScore: number;

  @Column({
    name: 'ic_raw',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  icRaw: number;

  @Column({
    name: 'ic_public',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  icPublic: number;

  @Column({
    name: 'eligibility_status',
    type: 'enum',
    enum: EligibilityStatus,
    default: EligibilityStatus.PENDING,
  })
  eligibilityStatus: EligibilityStatus;

  @Column({ name: 'explanation_json', type: 'jsonb', nullable: true })
  explanationJson: object;

  @Column({ name: 'calculated_at' })
  calculatedAt: Date;

  @Column({ name: 'valid_from', nullable: true })
  validFrom: Date;

  @Column({ name: 'valid_to', nullable: true })
  validTo: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => Project, { nullable: true })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Tramo, { nullable: true })
  @JoinColumn({ name: 'tramo_id' })
  tramo: Tramo;

  @ManyToOne(() => IcAlgorithmVersion, (version) => version.snapshots)
  @JoinColumn({ name: 'algorithm_version_id' })
  algorithmVersion: IcAlgorithmVersion;

  @OneToMany(() => ReputationIndexExplanation, (explanation) => explanation.snapshot, {
    cascade: true,
  })
  explanations: ReputationIndexExplanation[];
}