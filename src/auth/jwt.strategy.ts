import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UsersService } from '../users/users.service';
import { UserRole, UserStatus } from '../users/entities/user.entity';

const extractCookieToken = (request: { headers?: { cookie?: string } }): string | null => {
  const cookieHeader = request?.headers?.cookie;
  if (!cookieHeader) return null;

  const tokenPair = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('colibri_access_token='));

  return tokenPair ? decodeURIComponent(tokenPair.substring('colibri_access_token='.length)) : null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        extractCookieToken,
      ]),
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    try {
      const user = await this.usersService.findOneById(payload.sub);
      if (user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Usuario inactivo');
      }

      return {
        sub: user.id,
        email: user.email,
        role: user.role as UserRole,
        status: user.status,
      };
    } catch {
      throw new UnauthorizedException('Sesión no válida');
    }
  }
}
