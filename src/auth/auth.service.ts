import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { IGoogleUser } from './interfaces/googleUser.interface';
import { AuthProvider, User, UserRole, UserStatus } from 'src/users/entities/user.entity';
import { ILoginUser } from './interfaces/loginUser.interface';
import bcrypt from 'bcrypt';
import { IAuthCreate } from './interfaces/authCreate.interface';
import { SessionsService } from './sessions/sessions.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly sessionsService: SessionsService,
  ) {}

  private generateToken(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };
    return this.jwtService.sign(payload);
  }

  /** Emite el par access token + refresh token para una sesión nueva. */
  private async issueSession(user: User) {
    const token = this.generateToken(user);
    const refreshToken = await this.sessionsService.issueRefreshToken(user);
    return { token, refreshToken };
  }

  private assertActive(user: User) {
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('La cuenta está inactiva o suspendida');
    }
  }

  async createUser(user: IAuthCreate) {
    if (user.password !== user.confirmPassword) {
      throw new BadRequestException('Las contraseñas deben ser iguales');
    }
    const passwordHash = await bcrypt.hash(user.password, 10);
    const userCreate = await this.userService.create({
      email: user.email,
      password: passwordHash,
      fullName: user.fullName,
      provider: AuthProvider.LOCAL,
      role: UserRole.ENTREPRENEUR,
    });
    return {
      message: 'Usuario registrado con éxito',
      token: this.generateToken(userCreate),
    };
  }

  async loginUser(credentials: ILoginUser) {
    const userFound = await this.userService.findByEmail(credentials.email);
    if (!userFound) {
      throw new UnauthorizedException('El email o la contraseña son incorrectos');
    } else if (userFound.provider === AuthProvider.GOOGLE) {
      throw new UnauthorizedException('usá Google para iniciar sesión');
    } else if (
      !userFound.password ||
      !(await bcrypt.compare(credentials.password, userFound.password))
    ) {
      throw new UnauthorizedException('El email o la contraseña son incorrectos');
    } else {
      const token = this.generateToken(userFound);
      return {
        Message: 'Usuario logueado con éxito',
        token,
      };
    }
  }

  /**
   * Busca o crea el usuario de Google, pero NO emite tokens todavía.
   * OAUTH-001: la emisión se posterga hasta que el frontend canjea el
   * código de un solo uso (`OAuthExchangeService.consume`), para que el
   * JWT nunca viaje en la URL de redirección.
   */
  async resolveGoogleUser(user: IGoogleUser): Promise<User> {
    let userFound = await this.userService.findByEmail(user.email);
    if (!userFound) {
      userFound = await this.userService.create({
        email: user.email,
        fullName: user.fullName,
        googleId: user.googleId,
        password: null,
        avatar: user.avatar,
        provider: AuthProvider.GOOGLE,
        role: UserRole.ENTREPRENEUR,
      });
    }
    this.assertActive(userFound);
    return userFound;
  }

  /** Emite el par access token + refresh token para un usuario ya resuelto (login local, Google o canje de código). */
  async issueSessionForUser(user: User) {
    const { token, refreshToken } = await this.issueSession(user);
    return {
      Message: 'Usuario logueado con éxito',
      token,
      refreshToken,
    };
  }

  /** Rota un refresh token válido y emite un nuevo par de tokens. */
  async refresh(rawRefreshToken: string) {
    const { user, refreshToken } = await this.sessionsService.rotateRefreshToken(rawRefreshToken);
    const token = this.generateToken(user);
    return { token, refreshToken };
  }

  /** Cierra la sesión actual revocando su refresh token. */
  async logout(rawRefreshToken: string) {
    await this.sessionsService.revokeRefreshToken(rawRefreshToken);
    return { message: 'Sesión cerrada correctamente' };
  }
}