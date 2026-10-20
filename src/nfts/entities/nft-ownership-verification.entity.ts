import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NftProject } from './nft-project.entity';

/**
 * WEB3-003: resultado de una verificación de propiedad actual contra
 * blockchain (`ownerOf(uint256)`). Registro append-only para trazabilidad:
 * cada consulta deja chainId, contrato, tokenId, bloque y timestamp.
 */
export enum NftOwnershipVerificationStatus {
  /** La wallet verificada es la propietaria on-chain. */
  VERIFIED = 'verified',
  /** La verificación se ejecutó correctamente pero la wallet no posee el NFT. */
  NOT_OWNER = 'not_owner',
  /** Config válida pero la realidad on-chain no cuadra (red distinta,
   * contrato sin código, token inexistente, `ownerOf` revierte). */
  INVALID = 'invalid',
  /** No se pudo consultar la red/contrato por un fallo de infraestructura RPC. */
  UNAVAILABLE = 'unavailable',
}

@Entity('nft_ownership_verifications')
@Index('IDX_nft_ownership_verifications_project_checked', ['nftProjectId', 'checkedAt'])
export class NftOwnershipVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * NFT de proyecto consultado. Nullable con ON DELETE SET NULL para que la
   * fila de auditoría sobreviva a la eliminación del NFT.
   */
  @Column({ name: 'nft_project_id', type: 'uuid', nullable: true })
  nftProjectId: string | null;

  @Index('IDX_nft_ownership_verifications_chain_id')
  @Column({ name: 'chain_id', type: 'int' })
  chainId: number;

  @Column({ name: 'contract_address', type: 'varchar' })
  contractAddress: string;

  @Column({ name: 'token_id', type: 'varchar' })
  tokenId: string;

  /** Wallet verificada, normalizada a minúsculas. */
  @Index('IDX_nft_ownership_verifications_wallet_address')
  @Column({ name: 'wallet_address', type: 'varchar', length: 42 })
  walletAddress: string;

  /** Propietario on-chain devuelto por `ownerOf`, normalizado a minúsculas. */
  @Column({ name: 'owner_address', type: 'varchar', length: 42, nullable: true })
  ownerAddress: string | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: NftOwnershipVerificationStatus,
  })
  status: NftOwnershipVerificationStatus;

  @Column({ name: 'block_number', type: 'bigint', nullable: true })
  blockNumber: string | null;

  @Column({ name: 'block_hash', type: 'varchar', nullable: true })
  blockHash: string | null;

  @Column({ name: 'block_timestamp', type: 'timestamp', nullable: true })
  blockTimestamp: Date | null;

  /** Detalle de error de infraestructura RPC (solo en `unavailable`). */
  @Column({ name: 'rpc_error', type: 'text', nullable: true })
  rpcError: string | null;

  /** Motivo del resultado negativo (`invalid` / `not_owner`). */
  @Column({ name: 'validation_error', type: 'text', nullable: true })
  validationError: string | null;

  /**
   * Momento en que se ejecutó la verificación. Columna explícita (no
   * `@CreateDateColumn`): el servicio debe setearla en TODOS los caminos,
   * incluido `unavailable`, para que nunca quede `null` en DB.
   */
  @Column({ name: 'checked_at', type: 'timestamp' })
  checkedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => NftProject, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'nft_project_id' })
  nftProject: NftProject | null;
}
