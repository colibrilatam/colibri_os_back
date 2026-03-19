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
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

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

  @Column({ name: 'valid_from', nullable: true })
  validFrom: Date;

  @Column({ name: 'valid_to', nullable: true })
  validTo: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}