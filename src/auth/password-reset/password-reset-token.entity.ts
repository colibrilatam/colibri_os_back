import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Token de un solo uso para el flujo de "reestablecer contraseña". Mismo
 * patrón que OAuthExchangeCode: nunca se persiste el token crudo, solo su
 * hash. El token vive poco tiempo y se invalida al primer uso (o al emitir
 * uno nuevo para el mismo usuario, para que solo el último enlace enviado
 * por email sea válido).
 */
@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'token_hash', unique: true })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  // Marca el token como consumido. Un token con used_at seteado nunca
  // vuelve a canjearse, aunque no haya expirado todavía.
  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt: Date | null;

  // Snapshot de la IP/user-agent que solicitó el reset, solo para
  // auditoría/soporte. No se usa para autorizar nada.
  @Column({ name: 'requested_from_ip', type: 'varchar', nullable: true })
  requestedFromIp: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}