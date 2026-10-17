import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../cookie.helper';

interface GuardRequest {
  method: string;
  path?: string;
  url?: string;
  route?: { path?: string };
  headers: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string>;
}

/**
 * QA-001: guard CSRF por doble submit para sesiones basadas en cookie.
 *
 * Contexto / decision de alcance:
 *  - SEC-003 se mergeo sin token CSRF formal; la mitigacion era SameSite + CORS.
 *  - QA-001 agrega un token de doble submit como expansion explicita de alcance.
 *
 * Reglas:
 *  - Solo aplica a metodos mutantes (POST/PUT/PATCH/DELETE).
 *  - Solo aplica a requests **basadas en cookie** (el navegador adjunta la
 *    cookie de sesion automaticamente, ese es el vector CSRF). Si la request
 *    viene con `Authorization: Bearer`, es un cliente que fija headers
 *    explicitamente y NO es vulnerable a CSRF; se omite (los tests Jest e2e
 *    usan Bearer y siguen funcionando sin cambios).
 *  - Si no hay cookie de sesion, no hay nada que proteger aqui: el
 *    JwtAuthGuard global respondera 401 mas adelante. Se omite.
 *  - Rutas pre-sesion (login, signup, oauth, refresh, health, etc.) quedan
 *    excluidas: todavia no existe (o se esta creando) la sesion.
 *  - Si falta el header o no coincide con la cookie -> 403.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name);

  private static readonly PROTECTED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

  /**
   * Prefijos de ruta (post global-prefix `/api/v1`) que no requieren CSRF.
   * Se comparan con `endsWith`, igual que en DemoReadOnlyGuard.
   */
  private static readonly EXCLUDED_PATHS = [
    '/auth/signin',
    '/auth/signup',
    '/auth/demo-login',
    '/auth/refresh',
    '/auth/complete-profile',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/google',
    '/auth/google/callback',
    '/auth/google/exchange',
    '/health',
    '/ready',
  ];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<GuardRequest>();

    if (!CsrfGuard.PROTECTED_METHODS.has(request.method)) {
      return true;
    }

    const path = request.route?.path ?? request.path ?? request.url ?? '';
    if (CsrfGuard.EXCLUDED_PATHS.some((excluded) => path.endsWith(excluded))) {
      return true;
    }

    const cookies = this.parseCookies(request);

    // Sin cookie de sesion no aplica: la autenticacion resolvera 401.
    if (!cookies[CSRF_COOKIE_NAME] && !cookies['colibri_access_token']) {
      return true;
    }

    // Requests con Bearer explicito no son vulnerables a CSRF.
    const authHeader = request.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return true;
    }

    const headerValue = request.headers[CSRF_HEADER_NAME];
    const provided = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    const cookieValue = cookies[CSRF_COOKIE_NAME];

    if (!provided || !cookieValue || provided !== cookieValue) {
      this.logger.warn(
        JSON.stringify({
          event: 'csrf_rejected',
          method: request.method,
          path,
          hasCookie: Boolean(cookieValue),
          hasHeader: Boolean(provided),
        }),
      );
      throw new ForbiddenException('Token CSRF ausente o invalido');
    }

    return true;
  }

  private parseCookies(request: GuardRequest): Record<string, string> {
    if (request.cookies) {
      return request.cookies;
    }

    const header = request.headers.cookie;
    const cookieHeader = Array.isArray(header) ? header[0] : header;
    if (!cookieHeader) return {};

    return cookieHeader.split(';').reduce<Record<string, string>>((acc, pair) => {
      const index = pair.indexOf('=');
      if (index === -1) return acc;
      const name = pair.slice(0, index).trim();
      if (!name) return acc;
      acc[name] = decodeURIComponent(pair.slice(index + 1).trim());
      return acc;
    }, {});
  }
}
