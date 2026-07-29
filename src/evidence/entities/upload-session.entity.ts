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
import { Project } from '../../projects/entities/project.entity';

@Entity('upload_sessions')
export class UploadSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'evidence_id' })
  evidenceId: string;

  @Column({ name: 'author_user_id' })
  authorUserId: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ name: 'expected_public_id', unique: true })
  expectedPublicId: string;

  @Column()
  folder: string;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ name: 'resource_type' })
  resourceType: 'image' | 'video' | 'raw';

  @Column({ name: 'max_bytes', type: 'int' })
  maxBytes: number;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'consumed_at', type: 'timestamptz', nullable: true })
  consumedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Evidence)
  @JoinColumn({ name: 'evidence_id' })
  evidence: Evidence;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_user_id' })
  author: User;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
