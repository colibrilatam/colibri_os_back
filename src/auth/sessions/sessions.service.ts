import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { RefreshToken } from './refresh-token.entity';
import { User, UserStatus } from '../../users/entities/user.entity';

const DEFAULT_REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Evento crítico (suspensión, cambio de contraseña, logout global):
   * incrementa la versión de sesión del usuario y revoca todos sus
   * refresh tokens activos. Cualquier JWT emitido antes deja de ser
   * válido en la siguiente request, sin esperar a que expire.
   */
  async bumpSessionVersion(userId: string): Promise<number> {
    await this.userRepository.increment({ id: userId }, 'sessionVersion', 1);
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.refreshTokenRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );

    return user.sessionVersion;
  }

  async issueRefreshToken(user: User): Promise<string> {
    const rawToken = randomBytes(48).toString('hex');

    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        userId: user.id,
        tokenHash: this.hashToken(rawToken),
        sessionVersion: user.sessionVersion,
        expiresAt: new Date(Date.now() + this.getTtlMs()),
      }),
    );

    return rawToken;
  }

  /**
   * Valida y rota un refresh token. Si el token ya fue usado (revokedAt
   * seteado por una rotación anterior), está expirado, el usuario no está
   * activo, o la sessionVersion no coincide (sesión revocada), rechaza.
   */
  async rotateRefreshToken(rawToken: string): Promise<{ user: User; refreshToken: string }> {
    const tokenHash = this.hashToken(rawToken);
    const stored = await this.refreshTokenRepository.findOneBy({ tokenHash });

    if (!stored || stored.revokedAt || stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const user = await this.userRepository.findOneBy({ id: stored.userId });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Usuario inactivo o suspendido');
    }

    if (stored.sessionVersion !== user.sessionVersion) {
      throw new UnauthorizedException('Sesión revocada');
    }

    const newRawToken = randomBytes(48).toString('hex');
    const newHash = this.hashToken(newRawToken);

    stored.revokedAt = new Date();
    stored.replacedByTokenHash = newHash;
    await this.refreshTokenRepository.save(stored);

    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        userId: user.id,
        tokenHash: newHash,
        sessionVersion: user.sessionVersion,
        expiresAt: new Date(Date.now() + this.getTtlMs()),
      }),
    );

    return { user, refreshToken: newRawToken };
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    await this.refreshTokenRepository.update({ tokenHash }, { revokedAt: new Date() });
  }

  private getTtlMs(): number {
    return Number(
      this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN_MS') ?? DEFAULT_REFRESH_TOKEN_TTL_MS,
    );
  }

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}