import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from '../../users/entities/user.entity';

export enum DenialReason {
  NOT_OWNER_OR_MEMBER = 'not_owner_or_member',
  NOT_PRIMARY_OPERATOR = 'not_primary_operator',
  NOT_ASSIGNED_EVALUATOR = 'not_assigned_evaluator',
  ROLE_NOT_ALLOWED = 'role_not_allowed',
}

/**
 * SEC-003: registro inmutable de todo intento de acción denegado por la
 * capa de autorización por recurso (no por RolesGuard, que ya se ve en logs
 * HTTP). Permite reconstruir "quién intentó qué, sobre qué recurso, y por qué se lo rechazó".
 */
@Entity('authorization_denial_audits')
export class AuthorizationDenialAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'resource_type' })
  resourceType: string;

  @Column({ name: 'resource_id', nullable: true, type: 'varchar'  })
  resourceId: string | null;

  @Column()
  action: string;

  @Column({ name: 'attempted_by_user_id' })
  attemptedByUserId: string;

  @Column({ name: 'attempted_by_role', type: 'enum', enum: UserRole })
  attemptedByRole: UserRole;

  @Column({ type: 'enum', enum: DenialReason })
  reason: DenialReason;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}