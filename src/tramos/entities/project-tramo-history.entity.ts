// src/tramos/entities/project-tramo-history.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Tramo } from './tramo.entity';

@Entity('project_tramo_history')
export class ProjectTramoHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'tramo_id' })
  tramoId: string;

  /**
   * Momento en que el proyecto entró a este tramo.
   */
  @Column({ name: 'entered_at', type: 'timestamptz' })
  enteredAt: Date;

  /**
   * Momento en que el proyecto salió de este tramo.
   * NULL significa que es el tramo actual (registro abierto).
   */
  @Column({ name: 'left_at', type: 'timestamptz', nullable: true })
  leftAt: Date | null;

  /**
   * Días que el proyecto estuvo en este tramo.
   * Se calcula y persiste al cerrar el registro para facilitar métricas.
   */
  @Column({ name: 'days_in_tramo', type: 'int', nullable: true })
  daysInTramo: number | null;

  /**
   * Razón del cambio de tramo (avance, corrección administrativa, etc.)
   */
  @Column({ name: 'change_reason', type: 'text', nullable: true })
  changeReason: string | null;

  /**
   * ID del usuario que ejecutó el cambio (admin o sistema).
   */
  @Column({ name: 'changed_by_user_id', type: 'varchar', nullable: true })
  changedByUserId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // ─── Relaciones ────────────────────────────────────────────────────────────

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Tramo)
  @JoinColumn({ name: 'tramo_id' })
  tramo: Tramo;
}