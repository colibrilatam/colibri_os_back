import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PasswordResetToken } from './password-reset-token.entity';
import { PasswordResetMailer } from './password-reset-mailer';
import { User, AuthProvider, UserStatus } from '../../users/entities/user.entity';
import { SessionsService } from '../sessions/sessions.service';

const DEFAULT_RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutos

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private readonly resetTokenRepository: Repository<PasswordResetToken>,
    private readonly configService: ConfigService,
    private readonly sessionsService: SessionsService,
    private readonly mailer: PasswordResetMailer,
  ) {}

  /**
   * Solicita el reset. SIEMPRE responde igual (mismo mensaje, mismo status),
   * exista o no el email, y sin importar si la cuenta es de Google — así no
   * se puede usar este endpoint para enumerar emails registrados.
   */
  async requestReset(email: string, requestedFromIp?: string): Promise<{ message: string }> {
    const genericResponse = {
      message: 'Si el email existe, vas a recibir un enlace para reestablecer tu contraseña',
    };

    const user = await this.userRepository.findOneBy({ email });

    // Cuentas de Google no tienen password local que resetear: no filtramos
    // esto en la respuesta (mismo mensaje genérico) para no revelar el
    // provider del email consultado.
    if (!user || user.provider !== AuthProvider.LOCAL || user.status !== UserStatus.ACTIVE) {
      this.logger.log(
        `Solicitud de reset para email no elegible (no existe / no local / no activo)`,
      );
      return genericResponse;
    }

    // Invalida cualquier token previo sin usar del mismo usuario: solo el
    // último enlace enviado es válido.
    await this.resetTokenRepository.update(
      { userId: user.id, usedAt: IsNull() },
      { expiresAt: new Date() },
    );

    const rawToken = randomBytes(32).toString('hex');

    await this.resetTokenRepository.save(
      this.resetTokenRepository.create({
        userId: user.id,
        tokenHash: this.hashToken(rawToken),
        expiresAt: new Date(Date.now() + this.getTtlMs()),
        usedAt: null,
        requestedFromIp: requestedFromIp ?? null,
      }),
    );

    const resetUrl = this.buildResetUrl(rawToken);
    await this.mailer.sendResetLink(user.email, resetUrl);

    this.logger.log(`Token de reset emitido para usuario ${user.id}`);

    return genericResponse;
  }

  /**
   * Canjea el token y setea la nueva contraseña. Rechaza tokens
   * inexistentes, ya usados, expirados o de usuarios inactivos. Al
   * completar, invalida el token, bumpea sessionVersion (revoca todas las
   * sesiones activas del usuario, incluida la que originó el ataque si el
   * token hubiera sido robado) y revoca todos sus refresh tokens.
   */
  async resetPassword(rawToken: string, newPassword: string): Promise<{ message: string }> {
    const tokenHash = this.hashToken(rawToken);
    const stored = await this.resetTokenRepository.findOneBy({ tokenHash });

    if (!stored || stored.usedAt || stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('El enlace de reset es inválido, ya fue usado o expiró');
    }

    const user = await this.userRepository.findOneBy({ id: stored.userId });
    if (!user || user.status !== UserStatus.ACTIVE || user.provider !== AuthProvider.LOCAL) {
      throw new UnauthorizedException('No se puede reestablecer la contraseña de esta cuenta');
    }

    // Se marca como usado antes de tocar la contraseña: incluso si algo
    // falla después, el token ya no puede reutilizarse (mismo criterio que
    // OAuthExchangeService.consume).
    stored.usedAt = new Date();
    await this.resetTokenRepository.save(stored);

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update({ id: user.id }, { password: newPasswordHash });

    // Invalida cualquier otro token de reset pendiente del mismo usuario.
    await this.resetTokenRepository.update(
      { userId: user.id, usedAt: IsNull(), id: Not(stored.id) },
      { usedAt: new Date() },
    );

    // Revoca todas las sesiones activas (mismo comportamiento que
    // UsersService.changePassword): un reset de contraseña es un evento
    // crítico de seguridad.
    await this.sessionsService.bumpSessionVersion(user.id);

    this.logger.log(`Contraseña reestablecida para usuario ${user.id}`);

    return { message: 'Contraseña reestablecida con éxito' };
  }

  private buildResetUrl(rawToken: string): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    if (!frontendUrl) {
      throw new BadRequestException('FRONTEND_URL no está configurada');
    }
    const url = new URL('/reset-password', frontendUrl);
    url.searchParams.set('token', rawToken);
    return url.toString();
  }

  private getTtlMs(): number {
    return Number(
      this.configService.get<string>('PASSWORD_RESET_TOKEN_TTL_MS') ?? DEFAULT_RESET_TOKEN_TTL_MS,
    );
  }

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}