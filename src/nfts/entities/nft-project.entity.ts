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
import { Project } from '../../projects/entities/project.entity';
import { User } from '../../users/entities/user.entity';
import { MecenasNftPortfolio } from './mecenas-nft-portfolio.entity';
import { NftOwnershipEvent } from './nft-ownership-event.entity';

@Entity('nft_projects')
export class NftProject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'chain_id' })
  chainId: number;

  @Column({ name: 'contract_address' })
  contractAddress: string;

  @Column({ name: 'token_id' })
  tokenId: string;

  @Column({ name: 'nft_hash', nullable: true })
  nftHash: string;

  @Column({ name: 'metadata_uri', nullable: true })
  metadataUri: string;

  @Column({ name: 'current_visual_version', nullable: true })
  currentVisualVersion: string;

  @Column({ name: 'represented_tramo_id', nullable: true })
  representedTramoId: string;

  @Column({ name: 'current_holder_user_id', nullable: true })
  currentHolderUserId: string;

  @Column({ name: 'minted_at', nullable: true })
  mintedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @OneToOne(() => Project, (project) => project.nftProject)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'current_holder_user_id' })
  currentHolder: User;

  @OneToMany(() => MecenasNftPortfolio, (portfolio) => portfolio.nftProject)
  mecenasPortfolios: MecenasNftPortfolio[];

  @OneToMany(() => NftOwnershipEvent, (event) => event.nftProject)
  ownershipEvents: NftOwnershipEvent[];
}