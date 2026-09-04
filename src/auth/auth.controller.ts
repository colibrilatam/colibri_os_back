import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create.dto';
import type { Request, Response } from 'express';
import type { IGoogleUser } from './interfaces/googleUser.interface';
import { CompleteProfileDto } from './dto/complete-profile.dto';

type GoogleAuthenticatedRequest = Request & { user: IGoogleUser };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('google'))
  @Get('google')
  async getGoogle() {}

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

  @Post('signin')
  async loginUser(@Body() logindto: LoginDto) {
    return await this.authService.loginUser(logindto);
  }

  @Post('signup')
  async createUser(@Body() user: CreateUserDto) {
    return await this.authService.createUser(user);
  }

  @Post('complete-profile')
async completeProfile(@Body() dto: CompleteProfileDto) {
  return this.authService.completeProfile(dto);
}
}
