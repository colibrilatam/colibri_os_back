import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ActorNftType {
  MENTOR = 'mentor',
  MECENAS = 'mecenas',
}

@Entity('nft_actors')
export class NftActor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    name: 'actor_nft_type',
    type: 'enum',
    enum: ActorNftType,
  })
  actorNftType: ActorNftType;

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

  @Column({ name: 'minted_at', nullable: true })
  mintedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @OneToOne(() => User, (user) => user.nftActor)
  @JoinColumn({ name: 'user_id' })
  user: User;
}