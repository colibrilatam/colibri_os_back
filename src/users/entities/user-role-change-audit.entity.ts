import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from './user.entity';

@Entity('user_role_change_audits')
export class UserRoleChangeAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'target_user_id' })
  targetUserId: string;

  @Column({ name: 'changed_by_user_id' })
  changedByUserId: string;

  @Column({ name: 'previous_role', type: 'varchar' })
  previousRole: UserRole;

  @Column({ name: 'next_role', type: 'varchar' })
  nextRole: UserRole;

  @Column({ type: 'text' })
  reason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
