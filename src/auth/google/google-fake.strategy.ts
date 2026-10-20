import { Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { randomBytes } from 'crypto';
import type { Request } from 'express';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthProvider } from 'src/users/entities/user.entity';
import type { IGoogleUser } from '../interfaces/googleUser.interface';

const STATE_COOKIE_NAME = 'colibri_oauth_state';
const STATE_COOKIE_PATH = '/api/v1/auth/google';

interface RequestLike {
  query?: Record<string, string | undefined>;
  baseUrl?: string;
  path?: string;
  url?: string;
  headers?: { cookie?: string };
  res?: {
    cookie: (name: string, value: string, options?: Record<string, unknown>) => void;
    clearCookie: (name: string, options?: Record<string, unknown>) => void;
  };
}

interface PassportInternals {
  success: (user: IGoogleUser) => void;
  fail: (challenge: string | number, status?: number) => void;
  redirect: (url: string, status?: number) => void;
}

/**
 * QA-001: provider de OAuth falso para el entorno E2E, habilitado por la
 * variable `E2E_OAUTH_FAKE=true`. Reemplaza a `GoogleStrategy` (mismo nombre
 * de estrategia passport `google`) para simular el flujo completo de
 * Authorization Code sin llamar a Google.
 *
 * Fases:
 *  - `GET /auth/google`         -> fija la cookie `colibri_oauth_state` y
 *    redirige al callback con `?code=fake&state=<mismo>`.
 *  - `GET /auth/google/callback` -> valida el `state` contra la cookie (un solo
 *    uso) y produce un perfil Google sintetico; passport ejecuta `validate`.
 *
 * El email sintetico puede sobreescribirse con `?fake_email=` SOLO en modo
 * fake, para poder probar usuarios nuevos (PENDING_PROFILE) y existentes.
 *
 * Este archivo NUNCA se instancia cuando `E2E_OAUTH_FAKE` no es `true`
 * (ver AuthModule). No debe usarse en produccion.
 */
export class GoogleFakeStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleFakeStrategy.name);
  private readonly callbackUrl: string;

  constructor() {
    const callbackUrl =
      process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3000/api/v1/auth/google/callback';

    super({
      clientID: process.env.GOOGLE_CLIENT_ID ?? 'e2e-fake-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? 'e2e-fake-client-secret',
      callbackURL: callbackUrl,
    });

    this.callbackUrl = callbackUrl;
  }

  authenticate(request: Request, _options?: unknown): void {
    // Se normaliza el tipo de express a una vista minima para no acoplarnos a
    // los tipos internos de passport-oauth2.
    const req = request as unknown as RequestLike;
    const self = this as unknown as PassportInternals;
    const fullPath = `${req.baseUrl ?? ''}${req.path ?? req.url ?? ''}`;

    if (fullPath.endsWith('/callback')) {
      this.handleCallback(req, self);
      return;
    }

    this.handleInitiate(req, self);
  }

  private handleInitiate(req: RequestLike, self: PassportInternals): void {
    const state = randomHex();
    const isProduction = process.env.NODE_ENV === 'production';

    req.res?.cookie(STATE_COOKIE_NAME, state, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: STATE_COOKIE_PATH,
      maxAge: Number(process.env.OAUTH_STATE_COOKIE_MAX_AGE_MS ?? 5 * 60 * 1000),
    });

    const separator = this.callbackUrl.includes('?') ? '&' : '?';
    const emailParam = req.query?.fake_email
      ? `&fake_email=${encodeURIComponent(req.query.fake_email)}`
      : '';

    self.redirect(`${this.callbackUrl}${separator}code=e2e-fake-code&state=${state}${emailParam}`);
  }

  private handleCallback(req: RequestLike, self: PassportInternals): void {
    const providedState = req.query?.state;
    const cookieState = readCookie(req.headers?.cookie, STATE_COOKIE_NAME);

    // Un solo uso: se limpia apenas se intenta validar.
    req.res?.clearCookie(STATE_COOKIE_NAME, { path: STATE_COOKIE_PATH });

    if (!providedState || !cookieState || providedState !== cookieState) {
      this.logger.warn('E2E fake OAuth: state invalido o ausente');
      self.fail(401);
      return;
    }

    const email = req.query?.fake_email ?? 'e2e-google@colibri.test';
    const profile = {
      id: `e2e-google-${email}`,
      displayName: 'E2E Google User',
      emails: [{ value: email }],
      photos: [{ value: 'https://example.com/e2e-avatar.png' }],
    } as unknown as Profile;

    const user = this.validate('e2e-access-token', 'e2e-refresh-token', profile);
    self.success(user);
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile): IGoogleUser {
    return {
      email: profile.emails![0].value,
      fullName: profile.displayName,
      googleId: profile.id,
      avatar: profile.photos![0].value,
      provider: AuthProvider.GOOGLE,
    };
  }
}

function readCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const pair = cookieHeader
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.substring(name.length + 1)) : null;
}

function randomHex(): string {
  return randomBytes(32).toString('hex');
}
