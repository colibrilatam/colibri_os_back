import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Evaluation } from './evaluation.entity';
import { User } from '../../users/entities/user.entity';
import { ReviewDecision } from './evaluation.enums';

@Entity('evaluation_human_reviews')
export class EvaluationHumanReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'evaluation_id' })
  evaluationId: string;

  @Column({ name: 'reviewer_user_id' })
  reviewerUserId: string;

  @Column({
    name: 'review_decision',
    type: 'enum',
    enum: ReviewDecision,
  })
  reviewDecision: ReviewDecision;

  @Column({
    name: 'human_score',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  humanScore: number;

  @Column({ name: 'human_dimension_scores_json', type: 'jsonb', nullable: true })
  humanDimensionScoresJson: object;

  @Column({ name: 'agrees_with_ai', nullable: true })
  agreesWithAi: boolean;

  @Column({ name: 'override_reason', type: 'text', nullable: true })
  overrideReason: string;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ name: 'reviewed_at' })
  reviewedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @OneToOne(() => Evaluation, (evaluation) => evaluation.humanReview)
  @JoinColumn({ name: 'evaluation_id' })
  evaluation: Evaluation;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewer_user_id' })
  reviewer: User;
}