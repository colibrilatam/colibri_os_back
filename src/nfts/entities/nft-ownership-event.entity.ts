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

export enum NftChainProofStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REVERTED = 'reverted',
  INVALID = 'invalid',
}

@Entity('nft_ownership_events')
export class NftOwnershipEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nft_project_id', type: 'uuid' })
  nftProjectId: string;

  @Column({ name: 'from_user_id', type: 'varchar', nullable: true })
  fromUserId: string | null;

  @Column({ name: 'to_user_id', type: 'varchar', nullable: true })
  toUserId: string | null;

  @Column({
    type: 'enum',
    enum: NftEventType,
    name: 'event_type',
  })
  eventType: NftEventType;

  @Column({ type: 'varchar', nullable: true, name: 'tx_hash' })
txHash: string | null;

  /**
   * Fecha derivada del block.timestamp.
   * No debe aceptarse como dato confiable proveniente del cliente.
   */
  @Column({ name: 'occurred_at', type: 'timestamp' })
  occurredAt: Date;

  /**
   * Estado de validación de la transacción contra la blockchain.
   */
  @Column({
    name: 'chain_status',
    type: 'enum',
    enum: NftChainProofStatus,
    default: NftChainProofStatus.PENDING,
  })
  chainStatus: NftChainProofStatus;

  /**
   * Chain donde fue validada la transacción.
   */
  @Column({type: 'int', name: 'chain_id', nullable: true })
  chainId: number | null;

  /**
   * Contrato contra el que se verificó la transacción.
   */
  @Column({ name: 'contract_address', type: 'varchar', nullable: true })
  contractAddress: string | null;

  /**
   * Token ID obtenido de los logs on-chain.
   */
  @Column({ name: 'token_id', type: 'varchar', nullable: true })
  tokenId: string | null;

  /**
   * Dirección origen obtenida de la transacción/evento.
   */
  @Column({ name: 'from_address', type: 'varchar', nullable: true })
  fromAddress: string | null;

  /**
   * Dirección destino obtenida de la transacción/evento.
   */
  @Column({ name: 'to_address', type: 'varchar', nullable: true })
  toAddress: string | null;

  /**
   * Número de bloque donde fue incluida la transacción.
   */
  @Column({
    name: 'block_number',
    type: 'bigint',
    nullable: true,
  })
  blockNumber: string | null;

  /**
   * Hash del bloque donde fue incluida la transacción.
   */
  @Column({ name: 'block_hash', type: 'varchar', nullable: true })
  blockHash: string | null;

  /**
   * Confirmaciones actuales de la transacción.
   */
  @Column({
    name: 'confirmations',
    type: 'integer',
    default: 0,
  })
  confirmations: number;

  /**
   * Cantidad de confirmaciones requerida para considerar
   * la transacción confirmada.
   */
  @Column({
    name: 'required_confirmations',
    type: 'integer',
    default: 12,
  })
  requiredConfirmations: number;

  /**
   * Motivo por el cual una prueba on-chain fue rechazada.
   */
  @Column({
    name: 'validation_error',
    type: 'text',
    nullable: true,
  })
  validationError: string | null;

  /**
   * Momento en que la prueba fue validada.
   */
  @Column({
    name: 'verified_at',
    type: 'timestamp',
    nullable: true,
  })
  verifiedAt: Date | null;

  /**
   * Última reconciliación contra la blockchain.
   */
  @Column({
    name: 'last_reconciled_at',
    type: 'timestamp',
    nullable: true,
  })
  lastReconciledAt: Date | null;

  @CreateDateColumn({ name: 'recorded_at' })
  recordedAt: Date;

  @ManyToOne(() => NftProject, (nft) => nft.ownershipEvents)
  @JoinColumn({ name: 'nft_project_id' })
  nftProject: NftProject;

  @ManyToOne(() => User, (user) => user.nftTransfersSent, {
    nullable: true,
  })
  @JoinColumn({ name: 'from_user_id' })
  fromUser: User;

  @ManyToOne(() => User, (user) => user.nftTransfersReceived, {
    nullable: true,
  })
  @JoinColumn({ name: 'to_user_id' })
  toUser: User;
}