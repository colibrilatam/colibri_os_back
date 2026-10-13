import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiweMessage } from 'siwe';
import { ethers } from 'ethers';
import { randomBytes } from 'crypto';
import type { Response } from 'express';
import { WalletNonce, WalletNoncePurpose } from './entities/wallet-nonce.entity';
import { UserStatus } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import { SessionsService } from '../auth/sessions/sessions.service';
import { toPublicUser } from '../users/user.mapper';
import { setAuthCookie } from '../auth/cookie.helper';

@Injectable()
export class WalletAuthService {
  private readonly logger = new Logger(WalletAuthService.name);

  constructor(
    @InjectRepository(WalletNonce)
    private readonly nonceRepository: Repository<WalletNonce>,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly sessionsService: SessionsService,
  ) {}

  async generateNonce(
    walletAddress: string,
    chainId: number,
    purpose: WalletNoncePurpose,
    userId?: string,
  ): Promise<{ message: string; nonce: string }> {
    this.assertChainIdAllowed(chainId);

    const nonce = this.generateRandomNonce();
    const domain = this.configService.get<string>('WALLET_AUTH_DOMAIN')!;
    const uri = this.configService.get<string>('WALLET_AUTH_URI')!;
    const ttlMs = Number(this.configService.get<string>('WALLET_AUTH_NONCE_TTL_MS') ?? 300_000);
    const checksummedAddress = this.toChecksumAddress(walletAddress);

    let siweMessage: SiweMessage;
    try {
      siweMessage = new SiweMessage({
        domain,
        address: checksummedAddress,
        uri,
        version: '1',
        chainId,
        nonce,
        expirationTime: new Date(Date.now() + ttlMs).toISOString(),
      });
    } catch {
      throw new BadRequestException('No se pudo construir el mensaje SIWE');
    }

    const message = siweMessage.prepareMessage();

    const nonceEntity = this.nonceRepository.create({
      nonce,
      purpose,
      userId: purpose === WalletNoncePurpose.LINK ? userId! : null,
      walletAddress: checksummedAddress.toLowerCase(),
      message,
      domain,
      uri,
      chainId,
      expiresAt: new Date(Date.now() + ttlMs),
    });
    await this.nonceRepository.save(nonceEntity);

    return { message, nonce };
  }

  async loginWithWallet(message: string, signature: string, res: Response) {
    const consumedNonce = await this.verifyAndConsumeNonce(
      message,
      signature,
      WalletNoncePurpose.LOGIN,
    );

    let user = await this.usersService.findByCryptoWallet(consumedNonce.walletAddress);

    if (!user) {
      try {
        user = await this.usersService.createWalletUser(consumedNonce.walletAddress);
      } catch (e) {
        this.logger.warn('Race condition al crear usuario de wallet; reintentando búsqueda');
        user = await this.usersService.findByCryptoWallet(consumedNonce.walletAddress);
        if (!user) {
          throw e;
        }
      }
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('La cuenta está inactiva o suspendida');
    }

    const token = this.authService.buildAuthResult(user).token;
    setAuthCookie(res, token);

    return {
      message: 'Sesión iniciada con éxito',
      user: toPublicUser(user),
    };
  }

  async linkWallet(userId: string, message: string, signature: string) {
    const consumedNonce = await this.verifyAndConsumeNonce(
      message,
      signature,
      WalletNoncePurpose.LINK,
      userId,
    );

    const user = await this.usersService.findOneById(userId);

    if (user.cryptoWallet && user.cryptoWallet.toLowerCase() === consumedNonce.walletAddress) {
      throw new BadRequestException('Esta wallet ya está vinculada a tu cuenta');
    }

    const existingUser = await this.usersService.findByCryptoWallet(consumedNonce.walletAddress);
    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('Esta wallet ya está vinculada a otra cuenta');
    }

    await this.usersService.updateCryptoWallet(userId, consumedNonce.walletAddress);

    return {
      message: 'Wallet vinculada correctamente',
      user: toPublicUser({ ...user, cryptoWallet: consumedNonce.walletAddress }),
    };
  }

  async unlinkWallet(userId: string) {
    const user = await this.usersService.findOneById(userId);

    if (!user.cryptoWallet) {
      throw new BadRequestException('No tienes ninguna wallet vinculada');
    }

    await this.usersService.updateCryptoWallet(userId, null);
    await this.sessionsService.bumpSessionVersion(userId);

    return { message: 'Wallet desvinculada correctamente' };
  }

  private async verifyAndConsumeNonce(
    message: string,
    signature: string,
    purpose: WalletNoncePurpose,
    userId?: string,
  ): Promise<WalletNonce> {
    let siweMessage: SiweMessage;
    try {
      siweMessage = new SiweMessage(message);
    } catch {
      throw new BadRequestException('Formato de mensaje SIWE inválido');
    }

    const domain = this.configService.get<string>('WALLET_AUTH_DOMAIN')!;
    const uri = this.configService.get<string>('WALLET_AUTH_URI')!;

    if (siweMessage.domain !== domain) {
      throw new UnauthorizedException('Dominio inválido en el mensaje');
    }

    if (siweMessage.uri !== uri) {
      throw new UnauthorizedException('URI inválida en el mensaje');
    }

    if (!this.getAllowedChainIds().includes(siweMessage.chainId)) {
      throw new UnauthorizedException('Chain ID no permitido');
    }

    if (siweMessage.expirationTime && new Date(siweMessage.expirationTime) < new Date()) {
      throw new UnauthorizedException('El mensaje ha expirado');
    }

    const consumedNonce = await this.consumeNonceAtomic(siweMessage.nonce, purpose);

    if (!consumedNonce) {
      throw new UnauthorizedException('Nonce inválido, expirado o ya utilizado');
    }

    if (purpose === WalletNoncePurpose.LINK && consumedNonce.userId !== userId) {
      throw new UnauthorizedException('Este nonce no pertenece al usuario actual');
    }

    if (consumedNonce.message !== message) {
      throw new UnauthorizedException('El mensaje no coincide con el nonce');
    }

    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch {
      throw new UnauthorizedException('Firma inválida');
    }

    if (recoveredAddress.toLowerCase() !== consumedNonce.walletAddress) {
      throw new UnauthorizedException('La dirección recuperada de la firma no coincide');
    }

    return consumedNonce;
  }

  private async consumeNonceAtomic(
    nonce: string,
    purpose: WalletNoncePurpose,
  ): Promise<WalletNonce | null> {
    const result = await this.nonceRepository
      .createQueryBuilder()
      .update(WalletNonce)
      .set({ usedAt: () => 'NOW()' })
      .where('nonce = :nonce', { nonce })
      .andWhere('purpose = :purpose', { purpose })
      .andWhere('used_at IS NULL')
      .andWhere('expires_at > NOW()')
      .returning('id')
      .execute();

    const raw = result.raw as Array<{ id: string }> | undefined;
    const updatedId = raw?.[0]?.id;
    if (!updatedId) {
      return null;
    }

    return this.nonceRepository.findOne({ where: { id: updatedId } });
  }

  private generateRandomNonce(): string {
    return '0x' + randomBytes(32).toString('hex');
  }

  private toChecksumAddress(address: string): string {
    try {
      return ethers.getAddress(address);
    } catch {
      throw new BadRequestException('Dirección de wallet inválida');
    }
  }

  private assertChainIdAllowed(chainId: number): void {
    if (!this.getAllowedChainIds().includes(chainId)) {
      throw new BadRequestException(`Chain ID ${chainId} no está permitido`);
    }
  }

  private getAllowedChainIds(): number[] {
    const raw = this.configService.get<string>('WALLET_AUTH_CHAIN_IDS') ?? '';
    return raw
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
  }
}
