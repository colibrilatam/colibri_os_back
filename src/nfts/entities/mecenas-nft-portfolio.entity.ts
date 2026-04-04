import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { NftProject } from './nft-project.entity';
import { Project } from '../../projects/entities/project.entity';

export enum PortfolioRole {
  SEED_ALLY = 'seed_ally',
  SPONSOR = 'sponsor',
  GUARDIAN = 'guardian',
}

@Entity('mecenas_nft_portfolios')
export class MecenasNftPortfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'mecenas_user_id' })
  mecenasUserId: string;

  @Column({ name: 'nft_project_id' })
  nftProjectId: string;

  @Column({ name: 'target_project_id', nullable: true })
  targetProjectId: string | null;

  @Column({
    name: 'portfolio_role',
    type: 'enum',
    enum: PortfolioRole,
    nullable: true,
  })
  portfolioRole: PortfolioRole | null;

  @Column({ name: 'acquired_at', nullable: true })
  acquiredAt: Date;

  @Column({ name: 'released_at', nullable: true })
  releasedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => User, (user) => user.nftPortfolio)
  @JoinColumn({ name: 'mecenas_user_id' })
  mecenas: User;

  @ManyToOne(() => NftProject, (nft) => nft.mecenasPortfolios)
  @JoinColumn({ name: 'nft_project_id' })
  nftProject: NftProject;

  @ManyToOne(() => Project, (project) => project.mecenasPortfolios, {
    nullable: true,
  })
  @JoinColumn({ name: 'target_project_id' })
  targetProject: Project;
}