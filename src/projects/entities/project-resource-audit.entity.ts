import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum ProjectAuditResourceType {
  PROJECT = 'project',
  PROJECT_PAC = 'project_pac',
}

export enum ProjectAuditAction {
  UPDATE = 'update',
  DELETE = 'delete',
  PAC_CREATE = 'pac_create',
  PAC_STATUS_CHANGE = 'pac_status_change',
  PAC_DELETE = 'pac_delete',
}

/**
 * SEC-006B: registro de auditoría de toda modificación, eliminación o
 * cambio de estado sobre un proyecto o sus PACs, para poder reconstruir
 * quién hizo qué y cuándo.
 */
@Entity('project_resource_audits')
export class ProjectResourceAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'resource_type', type: 'enum', enum: ProjectAuditResourceType })
  resourceType: ProjectAuditResourceType;

  @Column({ name: 'resource_id' })
  resourceId: string;

  @Column({ type: 'enum', enum: ProjectAuditAction })
  action: ProjectAuditAction;

  @Column({ name: 'performed_by_user_id' })
  performedByUserId: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @Column({ type: 'jsonb', nullable: true })
  changes: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}