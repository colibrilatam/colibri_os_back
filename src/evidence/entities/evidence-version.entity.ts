import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Evidence } from './evidence.entity';
import { User } from '../../users/entities/user.entity';

@Entity('evidence_versions')
@Unique(['evidenceId', 'versionNumber'])
export class EvidenceVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'evidence_id' })
  evidenceId: string;

  @Column({ name: 'version_number' })
  versionNumber: number;

  @Column({ name: 'storage_uri', nullable: true })
  storageUri: string;

  @Column({ name: 'content_hash', nullable: true })
  contentHash: string;

  @Column({ name: 'hash_algorithm', type: 'varchar', nullable: true })
  hashAlgorithm: string | null;

  @Column({ name: 'cloudinary_public_id', type: 'varchar', nullable: true })
  cloudinaryPublicId: string | null;

  @Column({ name: 'asset_version', type: 'varchar', nullable: true })
  assetVersion: string | null;

  @Column({ name: 'provider_checksum', type: 'varchar', nullable: true })
  providerChecksum: string | null;

  @Column({ name: 'mime_type', type: 'varchar', nullable: true })
  mimeType: string | null;

  @Column({ name: 'byte_size', type: 'int', nullable: true })
  byteSize: number | null;

  @Column({ name: 'change_summary', type: 'text', nullable: true })
  changeSummary: string;

  @Column({ name: 'is_material_change', default: false })
  isMaterialChange: boolean;

  @Column({ name: 'supersedes_version_number', type: 'int', nullable: true })
  supersedesVersionNumber: number | null;

  @Column({ name: 'created_by_user_id' })
  createdByUserId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => Evidence, (evidence) => evidence.versions)
  @JoinColumn({ name: 'evidence_id' })
  evidence: Evidence;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy: User;
}
