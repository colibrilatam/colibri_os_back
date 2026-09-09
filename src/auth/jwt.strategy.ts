import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UsersService } from '../users/users.service';
import { UserRole, UserStatus } from '../users/entities/user.entity';

const COOKIE_NAME = 'colibri_access_token';

const extractCookieToken = (request: {
  cookies?: Record<string, string>;
  headers?: { cookie?: string };
}): string | null => {
  // Si cookie-parser está instalado, leer directamente del objeto cookies.
  if (request?.cookies?.[COOKIE_NAME]) {
    return request.cookies[COOKIE_NAME];
  }

  // Fallback: parsear manualmente el header Cookie (útil en tests sin cookie-parser).
  const cookieHeader = request?.headers?.cookie;
  if (!cookieHeader) return null;

  const tokenPair = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));

  return tokenPair ? decodeURIComponent(tokenPair.substring(`${COOKIE_NAME}=`.length)) : null;
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

      // La sessionVersion del token debe coincidir con la actual del
      // usuario. Cambia en cada suspensión, cambio de contraseña o logout
      // global, invalidando de inmediato cualquier JWT emitido antes,
      // sin esperar a que expire.
      if (payload.sessionVersion !== user.sessionVersion) {
        throw new UnauthorizedException('Sesión revocada');
      }

      return {
        sub: user.id,
        email: user.email,
        role: user.role as UserRole,
        status: user.status,
        sessionVersion: user.sessionVersion,
      };
    } catch (error){
      console.error('Error validating JWT payload:', error);
      throw new UnauthorizedException('Sesión no válida');
    }
  }
}