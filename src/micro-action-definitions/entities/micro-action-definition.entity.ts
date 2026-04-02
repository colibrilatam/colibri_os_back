import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Pac } from '../../pacs/entities/pac.entity';
import { LearningResource } from '../../learning-resource/entities/learning-resource.entity';
import { Rubric } from '../../evaluation/entities/rubric.entity';

export enum MicroActionType {
  RESEARCH = 'research',
  INTERVIEW = 'interview',
  PROTOTYPE = 'prototype',
  VALIDATION = 'validation',
  DOCUMENTATION = 'documentation',
  PITCH = 'pitch',
  NETWORKING = 'networking',
  OTHER = 'other',
}

export enum EvidenceType {
  TEXT = 'text',
  FILE = 'file',
  LINK = 'link',
  IMAGE = 'image',
  VIDEO = 'video',
}

@Entity('micro_action_definitions')
export class MicroActionDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pac_id' })
  pacId: string;

  @Column({ name: 'rubric_id', nullable: true })
  rubricId: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'text' })
  instruction: string;

  @Column({ name: 'sort_order' })
  sortOrder: number;

  @Column({ name: 'execution_window_days', nullable: true })
  executionWindowDays: number;

  @Column({
    name: 'micro_action_type',
    type: 'enum',
    enum: MicroActionType,
    nullable: true,
  })
  microActionType: MicroActionType;

  @Column({ name: 'is_required', default: false })
  isRequired: boolean;

  @Column({ name: 'is_reusable', default: false })
  isReusable: boolean;

  @Column({ name: 'evidence_required', default: false })
  evidenceRequired: boolean;

  @Column({
    name: 'expected_evidence_type',
    type: 'enum',
    enum: EvidenceType,
    nullable: true,
  })
  expectedEvidenceType: EvidenceType;

  @Column({
    name: 'consistency_weight',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  consistencyWeight: number;

  @Column({
    name: 'collaboration_weight',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  collaborationWeight: number;

  @Column({
    name: 'sustainability_weight',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  sustainabilityWeight: number;

  @Column({ name: 'valid_from', nullable: true })
  validFrom: Date;

  @Column({ name: 'valid_to', nullable: true })
  validTo: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Pac, (pac) => pac.microActionDefinitions)
  @JoinColumn({ name: 'pac_id' })
  pac: Pac;

  @ManyToOne(() => Rubric, { nullable: true })
  @JoinColumn({ name: 'rubric_id' })
  rubric: Rubric;

  @OneToMany(() => LearningResource, (lr) => lr.microActionDefinition)
  learningResources: LearningResource[];
}