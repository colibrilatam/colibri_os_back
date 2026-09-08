import type { Response } from 'express';

const COOKIE_NAME = 'colibri_access_token';

export function setAuthCookie(res: Response, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieMaxAge = Number(process.env.AUTH_COOKIE_MAX_AGE_MS ?? 7 * 24 * 60 * 60 * 1000);

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: cookieMaxAge,
    path: '/',
  });
}

export function clearAuthCookie(res: Response): void {
  const isProduction = process.env.NODE_ENV === 'production';

  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
}
