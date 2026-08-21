import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'token_hash', unique: true })
  tokenHash: string;

  // Copia de users.session_version en el momento de emisión.
  // Si no coincide con la actual del usuario, el token quedó revocado.
  @Column({ name: 'session_version', type: 'int' })
  sessionVersion: number;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt: Date | null;

  @Column({ name: 'replaced_by_token_hash', type: 'varchar', nullable: true })
  replacedByTokenHash: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}