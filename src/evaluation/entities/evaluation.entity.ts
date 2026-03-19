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
import { Evidence } from '../../execution/entities/evidence.entity';
import { Rubric } from './rubric.entity';
import { EvaluationAiResult } from './evaluation-ai-result.entity';
import { EvaluationHumanReview } from './evaluation-human-review.entity';
import { EvaluationType, EvaluationResult } from './evaluation.enums';

export { EvaluationType, EvaluationResult };

@Entity('evaluations')
export class Evaluation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'evidence_id' })
  evidenceId: string;

  @Column({ name: 'rubric_id' })
  rubricId: string;

  @Column({ name: 'rubric_version' })
  rubricVersion: string;

  @Column({
    name: 'evaluation_type',
    type: 'enum',
    enum: EvaluationType,
    default: EvaluationType.HYBRID,
  })
  evaluationType: EvaluationType;

  @Column({
    name: 'evaluation_result',
    type: 'enum',
    enum: EvaluationResult,
    nullable: true,
  })
  evaluationResult: EvaluationResult;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  score: number;

  @Column({ name: 'dimension_scores_json', type: 'jsonb', nullable: true })
  dimensionScoresJson: object;

  @Column({ name: 'is_final', default: false })
  isFinal: boolean;

  @Column({
    name: 'evaluation_source_weight',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  evaluationSourceWeight: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ name: 'evaluated_at', nullable: true })
  evaluatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Evidence, (evidence) => evidence.evaluations)
  @JoinColumn({ name: 'evidence_id' })
  evidence: Evidence;

  @ManyToOne(() => Rubric)
  @JoinColumn({ name: 'rubric_id' })
  rubric: Rubric;

  @OneToOne(() => EvaluationAiResult, (ai) => ai.evaluation, { cascade: true })
  aiResult: EvaluationAiResult;

  @OneToOne(() => EvaluationHumanReview, (hr) => hr.evaluation, { cascade: true })
  humanReview: EvaluationHumanReview;
}