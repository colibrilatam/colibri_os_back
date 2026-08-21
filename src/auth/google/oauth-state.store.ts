import type { Request } from 'express';
import { randomBytes, timingSafeEqual } from 'crypto';

const STATE_COOKIE_NAME = 'colibri_oauth_state';
const STATE_COOKIE_PATH = '/api/v1/auth/google';
const DEFAULT_STATE_COOKIE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutos: dura lo que tarda el flow en Google

function readCookie(req: Request, name: string): string | null {
  const header = req.headers?.cookie;
  if (!header) return null;

  const match = header
    .split(';')
    .map((pair) => pair.trim())
    .find((pair) => pair.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.substring(name.length + 1)) : null;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Implementación de `StateStore` de passport-oauth2 que no depende de
 * express-session. El `state` anti-CSRF se guarda en una cookie HttpOnly +
 * Secure + SameSite de vida corta cuando arranca el flow (`store`), y se
 * valida en tiempo constante contra el parámetro `state` que Google
 * devuelve en el callback (`verify`). La cookie es de un solo uso: se borra
 * apenas se intenta validar, haya sido válida o no.
 */
type StoreCallback = (err: Error | null, state?: string) => void;
type VerifyCallback = (err: Error | null, ok: boolean, info?: { message: string }) => void;

export class OAuthStateStore {
  // passport-oauth2 inspecciona `store.length` en tiempo de ejecución para
  // decidir qué forma de llamada usar (con o sin `meta`). Declaramos ambos
  // overloads para satisfacer el tipo `StateStore`, pero la implementación
  // deja `maybeCallback` como opcional a propósito: así `store.length` sigue
  // valiendo 2, que es la forma de llamada que realmente usamos.
  store(req: Request, callback: StoreCallback): void;
  store(req: Request, meta: unknown, callback: StoreCallback): void;
  store(req: Request, metaOrCallback: unknown, maybeCallback?: StoreCallback): void {
    const callback = (maybeCallback ?? (metaOrCallback as StoreCallback)) as StoreCallback;
    const res = req.res;
    if (!res) {
      callback(new Error('No hay Response disponible para fijar la cookie de estado OAuth'));
      return;
    }

    const state = randomBytes(32).toString('hex');
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie(STATE_COOKIE_NAME, state, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax', // alcanza: la cookie solo se usa en la navegación GET top-level del callback
      maxAge: Number(process.env.OAUTH_STATE_COOKIE_MAX_AGE_MS ?? DEFAULT_STATE_COOKIE_MAX_AGE_MS),
      path: STATE_COOKIE_PATH,
    });

    callback(null, state);
  }

  // Mismo criterio que en `store`: `maybeCallback` opcional mantiene
  // `verify.length === 3`, que es la forma de llamada `(req, state, cb)`.
  verify(req: Request, providedState: string, callback: VerifyCallback): void;
  verify(req: Request, providedState: string, meta: unknown, callback: VerifyCallback): void;
  verify(
    req: Request,
    providedState: string,
    metaOrCallback: unknown,
    maybeCallback?: VerifyCallback,
  ): void {
    const callback = (maybeCallback ?? (metaOrCallback as VerifyCallback)) as VerifyCallback;
    const res = req.res;
    const cookieState = readCookie(req, STATE_COOKIE_NAME);

    // Un solo uso: se limpia apenas se intenta validar.
    res?.clearCookie(STATE_COOKIE_NAME, { path: STATE_COOKIE_PATH });

    if (!cookieState || !providedState) {
      callback(null, false, { message: 'Falta la cookie de estado OAuth o el parámetro state' });
      return;
    }

    if (!safeEqual(cookieState, providedState)) {
      callback(null, false, { message: 'El parámetro state no coincide con el esperado' });
      return;
    }

    callback(null, true);
  }
}