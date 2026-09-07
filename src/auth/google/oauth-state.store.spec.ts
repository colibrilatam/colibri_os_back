import { OAuthStateStore } from './oauth-state.store';

describe('OAuthStateStore', () => {
  let store: OAuthStateStore;
  let cookieMock: jest.Mock;
  let clearCookieMock: jest.Mock;

  beforeEach(() => {
    store = new OAuthStateStore();
    cookieMock = jest.fn();
    clearCookieMock = jest.fn();
  });

  function buildReq(cookieHeader?: string) {
    return {
      headers: { cookie: cookieHeader },
      res: { cookie: cookieMock, clearCookie: clearCookieMock },
    } as never;
  }

  it('fija una cookie de state de un solo uso con atributos seguros', (done) => {
    const req = buildReq();

    store.store(req, (err, state) => {
      expect(err).toBeNull();
      expect(state).toEqual(expect.any(String));
      expect(cookieMock).toHaveBeenCalledWith(
        'colibri_oauth_state',
        state,
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/api/v1/auth/google',
        }),
      );
      done();
    });
  });

  it('acepta el state cuando coincide con el de la cookie', (done) => {
    const state = 'abc123';
    const req = buildReq(`colibri_oauth_state=${state}`);

    store.verify(req, state, (err, ok) => {
      expect(err).toBeNull();
      expect(ok).toBe(true);
      expect(clearCookieMock).toHaveBeenCalled(); // se invalida tras el primer uso
      done();
    });
  });

  it('rechaza un state modificado (tampering)', (done) => {
    const req = buildReq('colibri_oauth_state=estado-original');

    store.verify(req, 'estado-modificado-por-atacante', (err, ok, info) => {
      expect(err).toBeNull();
      expect(ok).toBe(false);
      expect(info?.message).toMatch(/no coincide/i);
      expect(clearCookieMock).toHaveBeenCalled();
      done();
    });
  });

  it('rechaza la verificación si no hay cookie de state (contexto inválido)', (done) => {
    const req = buildReq(undefined);

    store.verify(req, 'cualquier-state', (err, ok, info) => {
      expect(err).toBeNull();
      expect(ok).toBe(false);
      expect(info?.message).toMatch(/falta la cookie/i);
      done();
    });
  });

  it('rechaza la verificación si no llega parámetro state', (done) => {
    const req = buildReq('colibri_oauth_state=abc123');

    store.verify(req, '', (err, ok) => {
      expect(ok).toBe(false);
      done();
    });
  });
});