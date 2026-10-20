import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { InjectThrottlerStorage, ThrottlerException, ThrottlerStorage } from '@nestjs/throttler';
import type { Request } from 'express';

import type { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';

type AuthenticatedRequest = Request & { user?: JwtPayload };

/**
 * WEB3-003: rate limit por **usuario** para
 * `POST /nft-projects/:id/verify-ownership`.
 *
 * El `ThrottlerGuard` global se ejecuta ANTES de `JwtAuthGuard` (por eso
 * `DemoReadOnlyGuard` parsea el token a mano), de modo que en ese punto
 * `request.user` todavía no existe. Reordenar los `APP_GUARD` rompería rutas
 * que hoy dependen del throttle previo a la autenticación (p. ej.
 * `ops-003-mecenas-throttle`).
 *
 * Por eso este endpoint desactiva el throttle global (`@SkipThrottle`) y
 * aplica un guard **de ruta**: al ejecutarse después de los guards globales,
 * `request.user` ya está validado por `JwtAuthGuard`. Se reutiliza el
 * `ThrottlerStorage` del módulo global para no inventar almacenamiento propio.
 *
 * No parsea ni verifica el token: usa la identidad ya autenticada.
 */
@Injectable()
export class NftOwnershipThrottleGuard implements CanActivate {
  private static readonly LIMIT = 20;
  private static readonly TTL_MS = 60_000;
  private static readonly THROTTLER_NAME = 'nft-ownership-verification';

  constructor(
    @InjectThrottlerStorage()
    private readonly storage: ThrottlerStorage,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const tracker = request.user?.sub ?? request.ip ?? 'unknown';
    const key = `${NftOwnershipThrottleGuard.THROTTLER_NAME}:${tracker}`;

    const { isBlocked } = await this.storage.increment(
      key,
      NftOwnershipThrottleGuard.TTL_MS,
      NftOwnershipThrottleGuard.LIMIT,
      0,
      NftOwnershipThrottleGuard.THROTTLER_NAME,
    );

    if (isBlocked) {
      throw new ThrottlerException();
    }

    return true;
  }
}
