import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tramo } from '../../curriculum/entities/tramo.entity';
import { DimCategory } from './dim-category.entity';
import { FactProjectActivity } from './fact-project-activity.entity';
import { FactValidatedEvidence } from './fact-validated-evidence.entity';
import { FactSustainabilitySignal } from './fact-sustainability-signal.entity';

@Entity('dim_tramos')
export class DimTramo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tramo_id' })
  tramoId: string;

  @Column()
  code: string;

  @Column()
  name: string;

  @Column({ name: 'sort_order' })
  sortOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Relaciones
  @OneToOne(() => Tramo)
  @JoinColumn({ name: 'tramo_id' })
  tramo: Tramo;

  @OneToMany(() => DimCategory, (dc) => dc.tramo)
  categories: DimCategory[];

  @OneToMany(() => FactProjectActivity, (f) => f.tramo)
  projectActivities: FactProjectActivity[];

  @OneToMany(() => FactValidatedEvidence, (f) => f.tramo)
  validatedEvidences: FactValidatedEvidence[];

  @OneToMany(() => FactSustainabilitySignal, (f) => f.tramo)
  sustainabilitySignals: FactSustainabilitySignal[];
}