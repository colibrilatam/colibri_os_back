import type { Response } from 'express';
import { AuthController } from './auth.controller';

describe('AuthController - OAUTH-001', () => {
  let authService: { resolveGoogleUser: jest.Mock; issueSessionForUser: jest.Mock };
  let oauthExchangeService: { issue: jest.Mock; consume: jest.Mock };
  let controller: AuthController;
  let res: { redirect: jest.Mock; cookie: jest.Mock; json: jest.Mock };

  const googleUser = { email: 'a@b.com' } as never;
  const resolvedUser = { id: 'user-1' } as never;

  beforeEach(() => {
    authService = {
      resolveGoogleUser: jest.fn().mockResolvedValue(resolvedUser),
      issueSessionForUser: jest.fn(),
    };
    oauthExchangeService = {
      issue: jest.fn().mockResolvedValue('codigo-opaco-de-un-solo-uso'),
      consume: jest.fn(),
    };
    controller = new AuthController(authService as never, oauthExchangeService as never);
    res = { redirect: jest.fn(), cookie: jest.fn(), json: jest.fn().mockReturnThis() };
    process.env.FRONTEND_URL = 'https://app.colibri.test';
  });

  it('redirige con un código opaco, nunca con el JWT en la URL', async () => {
    const req = { user: googleUser } as never;

    await controller.getGoogleCallback(req, res as never as Response);

    expect(authService.resolveGoogleUser).toHaveBeenCalledWith(googleUser);
    expect(oauthExchangeService.issue).toHaveBeenCalledWith(resolvedUser);

    const redirectUrl = new URL(res.redirect.mock.calls[0][0]);
    expect(redirectUrl.searchParams.get('code')).toEqual('codigo-opaco-de-un-solo-uso');
    expect([...redirectUrl.searchParams.keys()]).toEqual(['code']);
    expect(redirectUrl.toString()).not.toMatch(/token|jwt|eyJ/i);
  });

  it('entrega el access token vía cookie segura, no en el body', async () => {
    oauthExchangeService.consume.mockResolvedValue(resolvedUser);
    authService.issueSessionForUser.mockResolvedValue({
      Message: 'Usuario logueado con éxito',
      token: 'jwt-de-acceso',
      refreshToken: 'refresh-de-sesion',
    });

    await controller.exchangeGoogleCode({ code: 'codigo-opaco' } as never, res as never as Response);

    expect(oauthExchangeService.consume).toHaveBeenCalledWith('codigo-opaco');
    expect(res.cookie).toHaveBeenCalledWith(
      'colibri_access_token',
      'jwt-de-acceso',
      expect.objectContaining({ httpOnly: true, path: '/' }),
    );

    const jsonPayload = res.json.mock.calls[0][0];
    expect(jsonPayload.token).toBeUndefined(); // el token no viaja en el body
    expect(jsonPayload.refreshToken).toEqual('refresh-de-sesion');
  });
});