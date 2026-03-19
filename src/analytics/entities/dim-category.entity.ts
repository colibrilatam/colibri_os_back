import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from '../../curriculum/entities/category.entity';
import { DimTramo } from './dim-tramo.entity';
import { DimPac } from './dim-pac.entity';

@Entity('dim_categories')
export class DimCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'category_id' })
  categoryId: string;

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
  @OneToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => DimTramo, (dt) => dt.categories)
  @JoinColumn({ name: 'tramo_id' })
  tramo: DimTramo;

  @OneToMany(() => DimPac, (dp) => dp.category)
  pacs: DimPac[];
}