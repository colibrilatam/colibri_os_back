import { BadRequestException, Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { GoogleExchangeDto } from './dto/google-exchange.dto';
import type { Request, Response } from 'express';
import type { IGoogleUser } from './interfaces/googleUser.interface';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { OAuthExchangeService } from './oauth/oauth-exchange.service';
import { Throttle } from '@nestjs/throttler';
import { Ip } from '@nestjs/common';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordResetService } from './password-reset/password-reset.service';

type GoogleAuthenticatedRequest = Request & { user: IGoogleUser };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oauthExchangeService: OAuthExchangeService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @UseGuards(AuthGuard('google'))
  @Get('google')
  async getGoogle() {}

  /**
   * OAUTH-001: ya no emite el JWT acá. El guard de passport valida el
   * `state` (ver OAuthStateStore) antes de llegar a este handler. Si es
   * válido, resolvemos el usuario y solo redirigimos con un código opaco
   * de un solo uso; el JWT se emite recién cuando el frontend lo canjea
   * en POST /auth/google/exchange.
   */
  @UseGuards(AuthGuard('google'))
@Get('google/callback')
async getGoogleCallback(@Req() req: GoogleAuthenticatedRequest, @Res() res: Response) {
  
  const result = await this.authService.googleLogin(req.user);
  const isProduction = process.env.NODE_ENV === 'production';

  if (result.requiresProfileCompletion) {
    const redirectUrl = `${process.env.FRONTEND_URL}/login/google-callback?tempToken=${result.tempToken}`;
    return res.redirect(redirectUrl);
  }
  console.log(result)
  res.cookie('colibri_access_token', result.token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: Number(process.env.AUTH_COOKIE_MAX_AGE_MS ?? 3_600_000),
    path: '/',
  });

  return res.redirect(`${process.env.FRONTEND_URL}/login/google-callback?role=${result.role}`);
}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('signin')
  async loginUser(@Body() logindto: LoginDto) {
    return await this.authService.loginUser(logindto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('signup')
  async createUser(@Body() user: CreateUserDto) {
    return await this.authService.createUser(user);
  }

  @Post('complete-profile')
async completeProfile(@Body() dto: CompleteProfileDto) {
  return this.authService.completeProfile(dto);
}

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return await this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto) {
    return await this.authService.logout(dto.refreshToken);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // 5 solicitudes / min por IP
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Ip() ip: string) {
    return await this.passwordResetService.requestReset(dto.email, ip);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('Las contraseñas nuevas deben ser iguales');
    }
    return await this.passwordResetService.resetPassword(dto.token, dto.newPassword);
  }
}