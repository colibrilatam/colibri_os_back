import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum WalletNoncePurpose {
  LOGIN = 'login',
  LINK = 'link',
}

@Entity('wallet_nonces')
export class WalletNonce {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ name: 'nonce', type: 'varchar', length: 66 })
  nonce: string;

  @Column({ name: 'purpose', type: 'enum', enum: WalletNoncePurpose })
  purpose: WalletNoncePurpose;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'wallet_address', type: 'varchar', length: 42 })
  walletAddress: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 255 })
  domain: string;

  @Column({ type: 'varchar', length: 255 })
  uri: string;

  @Column({ name: 'chain_id', type: 'int' })
  chainId: number;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
