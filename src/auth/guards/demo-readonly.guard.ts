import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { UserRole } from '../../users/entities/user.entity';

type AuthenticatedRequest = Request & { user?: { role?: string } };

/**
 * SEC-002 / PR-BE2: impone que las cuentas con rol `demo_readonly` solo
 * puedan ejecutar peticiones GET.
 *
 * Registrado como APP_GUARD global (app.module.ts). Se ejecuta ANTES de los
 * guards de controller (JwtAuthGuard, RolesGuard), por lo que no puede
 * depender de `request.user`. En su lugar, extrae y verifica el JWT del
 * Authorization header o de la cookie `colibri_access_token` directamente.
 *
 * Si el token es inválido o no está presente, el guard deja pasar: la
 * autenticación real la resuelve JwtAuthGuard más adelante.
 *
 * Excepciones: `POST /auth/logout` y `POST /auth/refresh`, para que la
 * cuenta demo pueda cerrar sesión y renovar su token sin violar la
 * restricción de solo lectura.
 */
@Injectable()
export class DemoReadOnlyGuard implements CanActivate {
  private readonly logger = new Logger(DemoReadOnlyGuard.name);

  /**
   * Rutas que el rol demo_readonly puede ejecutar aunque no sean GET.
   * Se comparan contra `request.route.path` (sin el prefijo global /api/v1).
   */
  private static readonly EXCEPTION_PATHS = new Set<string>([
    '/auth/logout',
    '/auth/refresh',
  ]);

  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      // Sin token: no es asunto de este guard. JwtAuthGuard decidirá.
      return true;
    }

    let role: string | undefined;
    try {
      const payload = this.jwtService.verify(token);
      role = payload?.role;
    } catch {
      // Token inválido/expirado: dejar que JwtAuthGuard maneje el 401.
      return true;
    }

    if (role !== UserRole.DEMO_READONLY) {
      return true;
    }

    if (request.method === 'GET') {
      return true;
    }

    // `request.route.path` puede incluir el prefijo global (/api/v1).
    // Usamos endsWith para cubrir ambos casos.
    const routePath: string = request.route?.path ?? request.path ?? '';

    const isException = [...DemoReadOnlyGuard.EXCEPTION_PATHS].some((p) =>
      routePath.endsWith(p),
    );

    if (isException) {
      return true;
    }

    this.logger.warn(
      `SEC-002: demo_readonly bloqueado en ${request.method} ${routePath || request.path}`,
    );

    throw new ForbiddenException(
      'La cuenta demo es de solo lectura. Esta acción no está permitida.',
    );
  }

  private extractToken(request: AuthenticatedRequest): string | null {
    // Header Authorization: Bearer <token>
    const authHeader = request.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    // Cookie colibri_access_token (mismo nombre que en cookie.helper.ts)
    const cookies = request.headers?.cookie;
    if (cookies) {
      const match = cookies.match(/(?:^|;\s*)colibri_access_token=([^;]+)/);
      if (match?.[1]) return match[1];
    }

    return null;
  }
}