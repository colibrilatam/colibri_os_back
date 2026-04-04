import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Evidence } from './evidence.entity';
import { User } from '../../users/entities/user.entity';

@Entity('evidence_versions')
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