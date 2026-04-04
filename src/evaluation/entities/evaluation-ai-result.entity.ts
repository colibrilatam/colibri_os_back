import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Evaluation } from './evaluation.entity';
import { Rubric } from './rubric.entity';
import { EvaluationResult } from './evaluation.enums';

@Entity('evaluation_ai_results')
export class EvaluationAiResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'evaluation_id' })
  evaluationId: string;

  @Column({ name: 'rubric_id' })
  rubricId: string;

  @Column({ name: 'rubric_version' })
  rubricVersion: string;

  @Column({ name: 'ai_model_used' })
  aiModelUsed: string;

  @Column({ name: 'ai_model_version', type: 'varchar', nullable: true })
  aiModelVersion: string | null;

  @Column({
    name: 'ai_result',
    type: 'enum',
    enum: EvaluationResult,
    nullable: true,
  })
  aiResult: EvaluationResult;

  @Column({
    name: 'ai_score',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  aiScore: number | null;

  @Column({ name: 'ai_dimension_scores_json', type: 'jsonb', nullable: true })
  aiDimensionScoresJson: object | null;

  @Column({
    name: 'ai_confidence',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  aiConfidence: number | null;

  @Column({ name: 'ai_reasoning', type: 'text', nullable: true })
  aiReasoning: string | null;

  @Column({ name: 'raw_response_json', type: 'jsonb', nullable: true })
  rawResponseJson: object | null;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relaciones
  @OneToOne(() => Evaluation, (evaluation) => evaluation.aiResult)
  @JoinColumn({ name: 'evaluation_id' })
  evaluation: Evaluation;

  @ManyToOne(() => Rubric)
  @JoinColumn({ name: 'rubric_id' })
  rubric: Rubric;
}