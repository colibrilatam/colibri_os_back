import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { ProjectMember } from '../../projects/entities/project-member.entity';
import { NftActor } from '../../nfts/entities/nft-actor.entity';
import { MecenasNftPortfolio } from '../../nfts/entities/mecenas-nft-portfolio.entity';
import { NftOwnershipEvent } from '../../nfts/entities/nft-ownership-event.entity';

export enum UserRole {
  ENTREPRENEUR = 'entrepreneur',
  MENTOR = 'mentor',
  MECENAS = 'mecenas',
  EVALUATOR = 'evaluator',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({
  type: 'enum',
  enum: AuthProvider,
  default: AuthProvider.LOCAL,
  })
  provider: AuthProvider;

  @Column({ name: 'linkedin_id', nullable: true })
  linkedinId: string;

  @Column({ name: 'google_id', nullable: true, unique: true })
  googleId: string;

  @Column({ name: 'crypto_wallet', nullable: true })
  cryptoWallet: string;

  @Column({ name: 'credentials_wallet', nullable: true })
  credentialsWallet: string;

  @Column({ name: 'adn_hash', nullable: true })
  adnHash: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'text', nullable: true })
  avatar: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @OneToMany(() => Project, (project) => project.owner)
  projects: Project[];

  @OneToMany(() => ProjectMember, (member) => member.user)
  projectMembers: ProjectMember[];

  @OneToOne(() => NftActor, (nftActor) => nftActor.user)
  nftActor: NftActor;

  @OneToMany(() => MecenasNftPortfolio, (portfolio) => portfolio.mecenas)
  nftPortfolio: MecenasNftPortfolio[];

  @OneToMany(() => NftOwnershipEvent, (event) => event.fromUser)
  nftTransfersSent: NftOwnershipEvent[];

  @OneToMany(() => NftOwnershipEvent, (event) => event.toUser)
  nftTransfersReceived: NftOwnershipEvent[];
}