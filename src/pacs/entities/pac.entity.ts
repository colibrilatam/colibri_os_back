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
import { Category } from '../../categories/entities/category.entity';
import { MicroActionDefinition } from '../../micro-action-definitions/entities/micro-action-definition.entity';
import { LearningResource } from '../../learning-resource/entities/learning-resource.entity';

@Entity('pacs')
export class Pac {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'category_id' })
  categoryId: string;

  @Column({ unique: true })
  code: string;

  @Column()
  title: string;

  @Column({ name: 'objective_line', type: 'text', nullable: true })
  objectiveLine: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'sort_order' })
  sortOrder: number;

  @Column({ name: 'execution_window_days', nullable: true })
  executionWindowDays: number;

  @Column({
    name: 'minimum_completion_threshold',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  minimumCompletionThreshold: number;

  @Column({
    name: 'ic_weight',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  icWeight: number;

  @Column({ name: 'closure_rule', type: 'text', nullable: true })
  closureRule: string;

  @Column({ name: 'template_version', nullable: true })
  templateVersion: string;

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
  @ManyToOne(() => Category, (category) => category.pacs)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => MicroActionDefinition, (mad) => mad.pac)
  microActionDefinitions: MicroActionDefinition[];

  @OneToMany(() => LearningResource, (lr) => lr.pac)
  learningResources: LearningResource[];
}