import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ProjectProfile } from '../../project-profile/entities/project-profile.entity';
import { ProjectMember } from '../../project-members/entities/project-member.entity';
import { NftProject } from '../../nfts/entities/nft-project.entity';
import { MecenasNftPortfolio } from '../../nfts/entities/mecenas-nft-portfolio.entity';

export enum ProjectStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CLOSED = 'closed',
  SUSPENDED = 'suspended',
}

export enum TrajectoryStatus {
  ON_TRACK = 'on_track',
  AT_RISK = 'at_risk',
  STALLED = 'stalled',
  COMPLETED = 'completed',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_user_id' })
  ownerUserId: string;

  @Column({ name: 'project_name' })
  projectName: string;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  status: ProjectStatus;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  industry: string;

  @Column({ nullable: true })
  tagline: string;

  @Column({ name: 'short_description', type: 'text', nullable: true })
  shortDescription: string;

  @Column({ name: 'startup_linkedin_url', nullable: true })
  startupLinkedinUrl: string;

  @Column({ name: 'website_url', nullable: true })
  websiteUrl: string;

  @Column({ name: 'rlab_profile_url', nullable: true })
  rlabProfileUrl: string;

  @Column({ name: 'opened_at', nullable: true })
  openedAt: Date;

  @Column({ name: 'closed_at', nullable: true })
  closedAt: Date;

  @Column({ name: 'close_reason', nullable: true })
  closeReason: string;

  @Column({ name: 'current_tramo_id', nullable: true })
  currentTramoId: string;

  @Column({ name: 'current_pac_id', nullable: true })
  currentPacId: string;

  @Column({ name: 'trajectory_status', type: 'enum', enum: TrajectoryStatus, nullable: true })
  trajectoryStatus: TrajectoryStatus;

  @Column({ name: 'last_activity_at', nullable: true })
  lastActivityAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.projects)
  @JoinColumn({ name: 'owner_user_id' })
  owner: User;

  @OneToOne(() => ProjectProfile, (profile) => profile.project, { cascade: true })
  profile: ProjectProfile;

  @OneToMany(() => ProjectMember, (member) => member.project)
  members: ProjectMember[];

  @OneToOne(() => NftProject, (nft) => nft.project)
  nftProject: NftProject;

  @OneToMany(() => MecenasNftPortfolio, (portfolio) => portfolio.targetProject)
  mecenasPortfolios: MecenasNftPortfolio[];
}