import { CallHandler, ExecutionContext, RequestTimeoutException } from '@nestjs/common';
import { of, delay, firstValueFrom } from 'rxjs';
import { TimeoutInterceptor } from '../../src/common/interceptors/timeout.interceptor';

describe('OPS-003: TimeoutInterceptor', () => {
  const originalTimeoutEnv = process.env.REQUEST_TIMEOUT_MS;

  afterEach(() => {
    process.env.REQUEST_TIMEOUT_MS = originalTimeoutEnv;
  });

  function buildContext(): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', originalUrl: '/api/v1/test-slow', ip: '127.0.0.1' }),
      }),
    } as unknown as ExecutionContext;
  }

  it('corta con RequestTimeoutException si el handler tarda más que REQUEST_TIMEOUT_MS', async () => {
    process.env.REQUEST_TIMEOUT_MS = '50';
    const interceptor = new TimeoutInterceptor();

    const slowHandler: CallHandler = {
      handle: () => of('respuesta').pipe(delay(200)), // 200ms > 50ms configurados
    };

    await expect(
      firstValueFrom(interceptor.intercept(buildContext(), slowHandler)),
    ).rejects.toBeInstanceOf(RequestTimeoutException);
  });

  it('deja pasar la respuesta si el handler responde antes del timeout', async () => {
    process.env.REQUEST_TIMEOUT_MS = '200';
    const interceptor = new TimeoutInterceptor();

    const fastHandler: CallHandler = {
      handle: () => of('respuesta').pipe(delay(10)),
    };

    const result = await firstValueFrom(interceptor.intercept(buildContext(), fastHandler));
    expect(result).toBe('respuesta');
  });
});