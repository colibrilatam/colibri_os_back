import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NftProject } from './nft-project.entity';
import { User } from '../../users/entities/user.entity';

export enum NftEventType {
  MINT = 'mint',
  TRANSFER = 'transfer',
  ASSIGN = 'assign',
  SALE = 'sale',
  BURN = 'burn',
}

@Entity('nft_ownership_events')
export class NftOwnershipEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nft_project_id' })
  nftProjectId: string;

  @Column({ name: 'from_user_id', nullable: true })
  fromUserId: string | null;

  @Column({ name: 'to_user_id', nullable: true })
  toUserId: string | null;

  @Column({ type: 'enum', enum: NftEventType, name: 'event_type' })
  eventType: NftEventType;

  @Column({ name: 'tx_hash', nullable: true })
  txHash: string;

  @Column({ name: 'occurred_at' })
  occurredAt: Date;

  @CreateDateColumn({ name: 'recorded_at' })
  recordedAt: Date;

  // Relaciones
  @ManyToOne(() => NftProject, (nft) => nft.ownershipEvents)
  @JoinColumn({ name: 'nft_project_id' })
  nftProject: NftProject;

  @ManyToOne(() => User, (user) => user.nftTransfersSent, { nullable: true })
  @JoinColumn({ name: 'from_user_id' })
  fromUser: User;

  @ManyToOne(() => User, (user) => user.nftTransfersReceived, { nullable: true })
  @JoinColumn({ name: 'to_user_id' })
  toUser: User;
}