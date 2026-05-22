import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';

export enum GenderProjectMember {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non_binary',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum RoleInTeam {
  FOUNDER = 'founder',
  CO_FOUNDER = 'co_founder',
  CTO = 'cto',
  CMO = 'cmo',
  DEVELOPER = 'developer',
  DESIGNER = 'designer',
  ADVISOR = 'advisor',
  OTHER = 'other',
}

@Entity('project_members')
@Unique(['projectId', 'userId'])
export class ProjectMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({type: 'enum', enum: GenderProjectMember, nullable: true})
  gender: GenderProjectMember;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'role_in_team', type: 'enum', enum: RoleInTeam, default: RoleInTeam.OTHER })
  roleInTeam: RoleInTeam;

  @Column({ name: 'joined_at', nullable: true })
  joinedAt: Date;

  @Column({ name: 'left_at', nullable: true })
  leftAt: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'participation_weight', type: 'numeric', precision: 5, scale: 2, nullable: true })
  participationWeight: number;

  @Column({ name: 'is_founder', default: false })
  isFounder: boolean;

  @Column({ name: 'is_primary_operator', default: false })
  isPrimaryOperator: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Project, (project) => project.members)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User, (user) => user.projectMembers)
  @JoinColumn({ name: 'user_id' })
  user: User;
}