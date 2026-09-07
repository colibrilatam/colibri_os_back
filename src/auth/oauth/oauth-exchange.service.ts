import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomBytes } from 'crypto';
import { OAuthExchangeCode } from './oauth-exchange-code.entity';
import { User, UserStatus } from '../../users/entities/user.entity';

const DEFAULT_EXCHANGE_CODE_TTL_MS = 60 * 1000; // 60s: alcanza para el redirect + el POST del frontend

@Injectable()
export class OAuthExchangeService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(OAuthExchangeCode)
    private readonly exchangeCodeRepository: Repository<OAuthExchangeCode>,
    private readonly configService: ConfigService,
  ) {}

  /** Emite un código opaco de un solo uso asociado a un usuario ya autenticado con Google. */
  async issue(user: User): Promise<string> {
    const rawCode = randomBytes(32).toString('hex');

    await this.exchangeCodeRepository.save(
      this.exchangeCodeRepository.create({
        userId: user.id,
        codeHash: this.hashCode(rawCode),
        expiresAt: new Date(Date.now() + this.getTtlMs()),
        usedAt: null,
      }),
    );

    return rawCode;
  }

  /**
   * Canjea un código por el usuario asociado. Rechaza códigos inexistentes,
   * ya usados, expirados o cuyo usuario dejó de estar activo. Marca el
   * código como usado antes de devolver el resultado, para que un segundo
   * intento con el mismo código (replay) falle siempre.
   */
  async consume(rawCode: string): Promise<User> {
    const codeHash = this.hashCode(rawCode);
    const stored = await this.exchangeCodeRepository.findOneBy({ codeHash });

    if (!stored || stored.usedAt || stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Código de intercambio inválido, ya usado o expirado');
    }

    // Se marca como usado antes de resolver el usuario: incluso si algo
    // falla después, el código ya no puede reutilizarse.
    stored.usedAt = new Date();
    await this.exchangeCodeRepository.save(stored);

    const user = await this.userRepository.findOneBy({ id: stored.userId });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Usuario inactivo o suspendido');
    }

    return user;
  }

  private getTtlMs(): number {
    return Number(
      this.configService.get<string>('OAUTH_EXCHANGE_CODE_TTL_MS') ?? DEFAULT_EXCHANGE_CODE_TTL_MS,
    );
  }

  private hashCode(rawCode: string): string {
    return createHash('sha256').update(rawCode).digest('hex');
  }
}