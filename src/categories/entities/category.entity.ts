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
import { Tramo } from '../../tramos/entities/tramo.entity';
import { Pac } from '../../pacs/entities/pac.entity';
import { UncertaintyType, RiskType } from '../../curriculum/entities/curriculum.enums';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tramo_id' })
  tramoId: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'sort_order' })
  sortOrder: number;

  @Column({ name: 'execution_window_days', nullable: true })
  executionWindowDays: number;

  @Column({
    name: 'uncertainty_type',
    type: 'enum',
    enum: UncertaintyType,
    nullable: true,
  })
  uncertaintyType: UncertaintyType;

  @Column({
    name: 'primary_risk_type',
    type: 'enum',
    enum: RiskType,
    nullable: true,
  })
  primaryRiskType: RiskType;

  @Column({ name: 'competency_mapping_key', nullable: true })
  competencyMappingKey: string;

  @Column({ name: 'skill_mapping_key', nullable: true })
  skillMappingKey: string;

  @Column({ name: 'skills_key', nullable: true })
  skillsKey: string;

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

  // Relaciones
  @ManyToOne(() => Tramo, (tramo) => tramo.categories)
  @JoinColumn({ name: 'tramo_id' })
  tramo: Tramo;

  @OneToMany(() => Pac, (pac) => pac.category)
  pacs: Pac[];
}