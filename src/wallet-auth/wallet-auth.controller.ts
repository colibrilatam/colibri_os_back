import { Body, Controller, Delete, HttpCode, Post, Res } from '@nestjs/common';
import {
  ApiTags,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { WalletAuthService } from './wallet-auth.service';
import { WalletNonceRequestDto } from './dto/wallet-nonce-request.dto';
import { WalletVerifyRequestDto } from './dto/wallet-verify-request.dto';
import { WalletNonceResponseDto } from './dto/wallet-nonce-response.dto';
import { WalletNoncePurpose } from './entities/wallet-nonce.entity';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { Response } from 'express';

@ApiTags('Wallet Auth')
@Controller('wallet-auth')
export class WalletAuthController {
  constructor(private readonly walletAuthService: WalletAuthService) {}

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Public()
  @Post('nonce')
  @HttpCode(200)
  @ApiOkResponse({ type: WalletNonceResponseDto })
  @ApiBadRequestResponse({ description: 'Chain ID no permitido' })
  async generateNonce(@Body() dto: WalletNonceRequestDto): Promise<WalletNonceResponseDto> {
    return this.walletAuthService.generateNonce(
      dto.walletAddress,
      dto.chainId,
      WalletNoncePurpose.LOGIN,
    );
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Public()
  @Post('verify')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Sesión iniciada con wallet' })
  @ApiUnauthorizedResponse({ description: 'Firma inválida o nonce expirado' })
  async verify(@Body() dto: WalletVerifyRequestDto, @Res({ passthrough: true }) res: Response) {
    return this.walletAuthService.loginWithWallet(dto.message, dto.signature, res);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('link/nonce')
  @HttpCode(200)
  @ApiOkResponse({ type: WalletNonceResponseDto })
  async generateLinkNonce(
    @CurrentUser('id') userId: string,
    @Body() dto: WalletNonceRequestDto,
  ): Promise<WalletNonceResponseDto> {
    return this.walletAuthService.generateNonce(
      dto.walletAddress,
      dto.chainId,
      WalletNoncePurpose.LINK,
      userId,
    );
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('link/verify')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Wallet vinculada correctamente' })
  @ApiUnauthorizedResponse({ description: 'Firma inválida o nonce expirado' })
  async verifyLink(@CurrentUser('id') userId: string, @Body() dto: WalletVerifyRequestDto) {
    return this.walletAuthService.linkWallet(userId, dto.message, dto.signature);
  }

  @Delete('unlink')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Wallet desvinculada correctamente' })
  async unlink(@CurrentUser('id') userId: string) {
    return this.walletAuthService.unlinkWallet(userId);
  }
}
