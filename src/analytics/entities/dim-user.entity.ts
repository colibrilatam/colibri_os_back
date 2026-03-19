import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { FactCompetencySignal } from './fact-competency-signal.entity';
import { FactSkillSignal } from './fact-skill-signal.entity';

@Entity('dim_users')
export class DimUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ nullable: true })
  role: string;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  country: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relaciones
  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => FactCompetencySignal, (f) => f.user)
  competencySignals: FactCompetencySignal[];

  @OneToMany(() => FactSkillSignal, (f) => f.user)
  skillSignals: FactSkillSignal[];
}