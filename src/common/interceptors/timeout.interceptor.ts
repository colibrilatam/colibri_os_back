import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, TimeoutError, catchError, throwError, timeout } from 'rxjs';

const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * OPS-003: corta cualquier request cuyo handler (controller + servicios +
 * queries) tarde más de REQUEST_TIMEOUT_MS, en vez de dejar la conexión
 * colgada indefinidamente. Se complementa con los timeouts de socket
 * configurados en main.ts (server.setTimeout / headersTimeout / requestTimeout),
 * que cubren el caso de conexiones colgadas a nivel de transporte.
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly logger = new Logger('TimeoutInterceptor');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const timeoutMs = Number(process.env.REQUEST_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      timeout(timeoutMs),
      catchError((err: unknown) => {
        if (err instanceof TimeoutError) {
          this.logger.warn(
            JSON.stringify({
              event: 'request_timeout',
              method: request?.method,
              path: request?.originalUrl ?? request?.url,
              ip: request?.ip,
              timeoutMs,
              timestamp: new Date().toISOString(),
            }),
          );
          return throwError(
            () => new RequestTimeoutException('La solicitud tardó demasiado en procesarse.'),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}