import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum NftAuditResourceType {
  NFT_ACTOR = 'nft_actor',
  MECENAS_PORTFOLIO = 'mecenas_portfolio',
}

export enum NftAuditAction {
  UPDATE = 'update',
}

@Entity('nft_resource_audits')
export class NftResourceAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'resource_type', type: 'enum', enum: NftAuditResourceType })
  resourceType: NftAuditResourceType;

  @Column({ name: 'resource_id' })
  resourceId: string;

  @Column({ name: 'action', type: 'enum', enum: NftAuditAction, default: NftAuditAction.UPDATE })
  action: NftAuditAction;

  @Column({ name: 'performed_by_user_id' })
  performedByUserId: string;

  @Column({ name: 'owner_user_id' })
  ownerUserId: string;

  @Column({ type: 'jsonb', nullable: true })
  changes: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}