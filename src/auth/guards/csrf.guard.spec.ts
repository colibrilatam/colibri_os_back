import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CsrfGuard } from './csrf.guard';

interface MockRequest {
  method: string;
  route?: { path: string };
  path?: string;
  url?: string;
  headers: Record<string, string | undefined>;
  cookies?: Record<string, string>;
}

function contextFor(request: MockRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('CsrfGuard (QA-001)', () => {
  let guard: CsrfGuard;

  beforeEach(() => {
    guard = new CsrfGuard();
  });

  const sessionCookie = 'colibri_access_token=abc.def.ghi';
  const csrfCookie = 'csrf_token=token-123';

  it('deja pasar metodos seguros (GET) sin exigir CSRF', () => {
    const ctx = contextFor({
      method: 'GET',
      route: { path: '/api/v1/projects' },
      headers: { cookie: `${sessionCookie}; ${csrfCookie}` },
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('deja pasar mutantes sin sesion (la autenticacion respondera 401)', () => {
    const ctx = contextFor({
      method: 'POST',
      route: { path: '/api/v1/projects' },
      headers: {},
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('deja pasar requests con Bearer (no vulnerables a CSRF)', () => {
    const ctx = contextFor({
      method: 'POST',
      route: { path: '/api/v1/projects' },
      headers: { cookie: sessionCookie, authorization: 'Bearer xyz' },
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('deja pasar rutas excluidas (login) sin sesion ni token', () => {
    const ctx = contextFor({
      method: 'POST',
      route: { path: '/api/v1/auth/signin' },
      headers: {},
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rechaza 403 cuando hay sesion por cookie y falta el header', () => {
    const ctx = contextFor({
      method: 'POST',
      route: { path: '/api/v1/projects' },
      headers: { cookie: `${sessionCookie}; ${csrfCookie}` },
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('rechaza 403 cuando el header no coincide con la cookie', () => {
    const ctx = contextFor({
      method: 'DELETE',
      route: { path: '/api/v1/projects/1' },
      headers: { cookie: `${sessionCookie}; ${csrfCookie}`, 'x-csrf-token': 'otro-valor' },
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('acepta cuando el header coincide con la cookie csrf', () => {
    const ctx = contextFor({
      method: 'PATCH',
      route: { path: '/api/v1/projects/1' },
      headers: { cookie: `${sessionCookie}; ${csrfCookie}`, 'x-csrf-token': 'token-123' },
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
