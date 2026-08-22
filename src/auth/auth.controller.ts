import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create.dto';
import { clearAuthCookie, setAuthCookie } from './cookie.helper';
import type { Request, Response } from 'express';
import type { IGoogleUser } from './interfaces/googleUser.interface';

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
    setAuthCookie(res, result.token);
    return res.redirect(`${process.env.FRONTEND_URL}/login/google-callback`);
  }

  @Post('signin')
  async loginUser(@Body() logindto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.loginUser(logindto);
    setAuthCookie(res, result.token);
    return { message: result.message, user: result.user };
  }

  @Post('signup')
  async createUser(@Body() user: CreateUserDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.createUser(user);
    setAuthCookie(res, result.token);
    return { message: result.message, user: result.user };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    clearAuthCookie(res);
    return { message: 'Sesión cerrada con éxito' };
  }
}
