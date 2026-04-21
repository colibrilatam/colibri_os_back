import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { UncertaintyType, RiskType } from '../../curriculum/entities/curriculum.enums';

export { UncertaintyType, RiskType };

@Entity('tramos')
export class Tramo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
  uncertaintyType: UncertaintyType; // uncertaintyType → origen de la incertidumbre

  @Column({
    name: 'primary_risk_type',
    type: 'enum',
    enum: RiskType,
    nullable: true,
  })
  primaryRiskType: RiskType; // primaryRiskType → tipo de riesgo (producto)

  @Column('text', { array: true, nullable: true })
  associatedRisks: string[]; // lista de riesgos concretos

  @Column({
    name: 'ic_floor',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  icFloor: number;

  @Column({ name: 'eligibility_rule', type: 'text', nullable: true })
  eligibilityRule: string;

  @Column({
    name: 'public_threshold',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  publicThreshold: number;

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
  @OneToMany(() => Category, (category) => category.tramo)
  categories: Category[];
}