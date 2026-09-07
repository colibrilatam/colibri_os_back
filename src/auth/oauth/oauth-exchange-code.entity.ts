import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Código de intercambio de un solo uso emitido tras un login exitoso con
 * Google OAuth. Reemplaza la práctica de devolver el JWT directamente en la
 * URL de redirección: el backend solo redirige con un código opaco de vida
 * corta, y el frontend lo canjea por los tokens reales vía POST
 * `/auth/google/exchange`. Así el JWT nunca queda expuesto en la URL,
 * el historial del navegador o el header Referer.
 */
@Entity('oauth_exchange_codes')
export class OAuthExchangeCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'code_hash', unique: true })
  codeHash: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  // Marca el código como consumido. Un código con used_at seteado nunca
  // vuelve a canjearse, aunque no haya expirado todavía.
  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}