import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TramoClosureStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Registro de idempotencia + outbox de auditoría para el cierre de tramo.
// Garantiza que la saga (snapshot + NFT + cambio de tramo) se ejecute
// una única vez por (projectId, tramoId), incluso ante reintentos o caídas
// a mitad de camino, y deja rastro para reconciliación.
@Entity('tramo_closure_operations')
export class TramoClosureOperation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Por defecto `${projectId}:${tramoId}`; el cliente puede mandar una
  // propia (ej. UUID generado en el frontend) si necesita reintentar
  // exactamente el mismo intento tras un timeout de red.
  @Index({ unique: true })
  @Column({ name: 'idempotency_key' })
  idempotencyKey: string;

  @Index()
  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'tramo_id' })
  tramoId: string;

  @Index()
  @Column({
    type: 'enum',
    enum: TramoClosureStatus,
    default: TramoClosureStatus.PENDING,
  })
  status: TramoClosureStatus;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError: string | null;

  // Resultado exacto devuelto la primera vez que la operación tuvo éxito.
  // Se re-devuelve igual en reintentos, sin re-ejecutar nada.
  @Column({ name: 'result_payload', type: 'jsonb', nullable: true })
  resultPayload: Record<string, unknown> | null;

  @Column({ name: 'requested_by_user_id', nullable: true })
  requestedByUserId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;
}