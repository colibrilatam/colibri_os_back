import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RubricTargetEntity {
  MICRO_ACTION = 'micro_action',
  EVIDENCE = 'evidence',
  BOTH = 'both',
}

@Entity('rubrics')
export class Rubric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name_es: string;

  @Column()
  name_en: string;

  @Column({ type: 'text', nullable: true })
  description_es: string;

  @Column({ type: 'text', nullable: true })
  description_en: string;

  @Column({
    name: 'target_entity',
    type: 'enum',
    enum: RubricTargetEntity,
  })
  targetEntity: RubricTargetEntity;

  @Column()
  version: string;

  @Column({ name: 'criteria_json', type: 'jsonb' })
  criteriaJson: object;

  @Column({ name: 'framework_reference', nullable: true })
  frameworkReference: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'valid_from', type: 'timestamptz', nullable: true })
  validFrom: Date | null;

  @Column({ name: 'valid_to', type: 'timestamptz', nullable: true })
  validTo: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}