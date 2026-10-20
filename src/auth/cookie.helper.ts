import { randomBytes } from 'crypto';
import type { Response } from 'express';

const COOKIE_NAME = 'colibri_access_token';

/**
 * QA-001: nombre de la cookie de doble submit para proteccion CSRF.
 *
 * A diferencia de `colibri_access_token`, esta cookie NO es HttpOnly: el
 * frontend debe poder leerla para copiarla al header `X-CSRF-Token` en cada
 * request mutante. La seguridad no viene de ocultarla, sino de que un sitio
 * atacante no puede leer el valor cross-origin (Same-Origin Policy) ni fijar
 * un header custom en una request forjada. El backend exige que el header
 * coincida con el valor de la cookie.
 */
export const CSRF_COOKIE_NAME = 'csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function baseCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'none' | 'lax';
  path: string;
} {
  const production = isProduction();
  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? 'none' : 'lax',
    path: '/',
  };
}

function csrfCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'none' | 'lax';
  path: string;
} {
  const production = isProduction();
  return {
    // No HttpOnly: el frontend la lee para el doble submit.
    httpOnly: false,
    secure: production,
    sameSite: production ? 'none' : 'lax',
    path: '/',
  };
}

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

export function setAuthCookie(res: Response, token: string, csrfToken?: string): void {
  const cookieMaxAge = Number(process.env.AUTH_COOKIE_MAX_AGE_MS ?? 7 * 24 * 60 * 60 * 1000);

  res.cookie(COOKIE_NAME, token, {
    ...baseCookieOptions(),
    maxAge: cookieMaxAge,
  });

  // QA-001: emitir/renovar el token CSRF junto con la sesion. Si el caller ya
  // genero uno (p.ej. rotacion), se respeta; si no, se genera uno nuevo.
  res.cookie(CSRF_COOKIE_NAME, csrfToken ?? generateCsrfToken(), {
    ...csrfCookieOptions(),
    maxAge: cookieMaxAge,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, baseCookieOptions());
  res.clearCookie(CSRF_COOKIE_NAME, csrfCookieOptions());
}

interface RequestLikeWithCookies {
  cookies?: Record<string, string>;
  headers?: { cookie?: string; authorization?: string };
}

/**
 * Extrae el JWT de sesion de un request: prioriza `Authorization: Bearer`
 * (clientes/tests) y cae a la cookie `colibri_access_token` (navegador).
 * Mismo criterio que `JwtStrategy`, centralizado para reuso en logout.
 */
export function extractTokenFromRequest(request: RequestLikeWithCookies): string | null {
  const authHeader = request.headers?.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  if (request.cookies?.[COOKIE_NAME]) {
    return request.cookies[COOKIE_NAME];
  }

  const cookieHeader = request.headers?.cookie;
  if (!cookieHeader) return null;

  const pair = cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));

  return pair ? decodeURIComponent(pair.substring(`${COOKIE_NAME}=`.length)) : null;
}
