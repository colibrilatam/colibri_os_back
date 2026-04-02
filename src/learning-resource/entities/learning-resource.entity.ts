import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Pac } from '../../pacs/entities/pac.entity';
import { MicroActionDefinition } from '../../micro-action-definitions/entities/micro-action-definition.entity';

export enum ResourceType {
  VIDEO = 'video',
  DOCUMENT = 'document',
  LINK = 'link',
  TEMPLATE = 'template',
  ARTICLE = 'article',
  PODCAST = 'podcast',
}

@Entity('learning_resources')
export class LearningResource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pac_id' })
  pacId: string;

  @Column()
  title: string;

  @Column({
    name: 'resource_type',
    type: 'enum',
    enum: ResourceType,
  })
  resourceType: ResourceType;

  @Column({ nullable: true })
  url: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_required', default: false })
  isRequired: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'micro_action_definition_id', nullable: true })
  microActionDefinitionId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Pac, (pac) => pac.learningResources)
  @JoinColumn({ name: 'pac_id' })
  pac: Pac;

  @ManyToOne(() => MicroActionDefinition, (mad) => mad.learningResources, {
    nullable: true,
  })
  @JoinColumn({ name: 'micro_action_definition_id' })
  microActionDefinition: MicroActionDefinition;
}