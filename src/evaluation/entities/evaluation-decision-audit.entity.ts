import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '../../users/entities/user.entity';
import { EvaluationResult } from './evaluation.enums';

/**
 * BE-001: registro inmutable de toda decisión de finalización de una
 * evaluación, para poder reconstruir quién aprobó/rechazó qué evidencia,
 * cuándo, y con qué puntaje.
 */
@Entity('evaluation_decision_audits')
export class EvaluationDecisionAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'evaluation_id' })
  evaluationId: string;

  @Column({ name: 'evidence_id' })
  evidenceId: string;

  @Column({ name: 'performed_by_user_id' })
  performedByUserId: string;

  @Column({ name: 'performed_by_role', type: 'enum', enum: UserRole })
  performedByRole: UserRole;

  @Column({ name: 'result', type: 'enum', enum: EvaluationResult })
  result: EvaluationResult;

  @Column({ name: 'score', type: 'numeric', precision: 5, scale: 2, nullable: true })
  score: number | null;

  @Column({ name: 'previous_evidence_status' })
  previousEvidenceStatus: string;

  @Column({ name: 'new_evidence_status' })
  newEvidenceStatus: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}