import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Pac } from '../../curriculum/entities/pac.entity';
import { DimCategory } from './dim-category.entity';
import { FactProjectActivity } from './fact-project-activity.entity';

@Entity('dim_pacs')
export class DimPac {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pac_id' })
  pacId: string;

  @Column({ name: 'category_id' })
  categoryId: string;

  @Column()
  code: string;

  @Column()
  title: string;

  @Column({ name: 'sort_order' })
  sortOrder: number;

  @Column({ name: 'template_version', nullable: true })
  templateVersion: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Relaciones
  @OneToOne(() => Pac)
  @JoinColumn({ name: 'pac_id' })
  pac: Pac;

  @ManyToOne(() => DimCategory, (dc) => dc.pacs)
  @JoinColumn({ name: 'category_id' })
  category: DimCategory;

  @OneToMany(() => FactProjectActivity, (f) => f.pac)
  projectActivities: FactProjectActivity[];
}