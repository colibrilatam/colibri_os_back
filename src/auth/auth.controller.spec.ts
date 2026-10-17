import type { Response } from 'express';
import { AuthController } from './auth.controller';
import { UserStatus } from '../users/entities/user.entity';

describe('AuthController — CODE-006', () => {
  let authService: {
    googleLogin: jest.Mock;
    toPublicUser: jest.Mock;
    issueProfileCompletionToken: jest.Mock;
    buildAuthResult: jest.Mock;
    completeProfile: jest.Mock;
  };
  let oauthExchangeService: { issue: jest.Mock; consume: jest.Mock };
  let controller: AuthController;
  let res: { redirect: jest.Mock; cookie: jest.Mock; json: jest.Mock };

  const googleUser = { email: 'a@b.com', fullName: 'Test User', googleId: 'g123', avatar: 'avatar.png' } as never;
  const activeUser = { id: 'user-1', email: 'a@b.com', fullName: 'Test User', role: 'entrepreneur', status: UserStatus.ACTIVE } as never;
  const pendingUser = { id: 'user-2', email: 'c@d.com', fullName: 'Pending User', role: null, status: UserStatus.PENDING_PROFILE } as never;

  beforeEach(() => {
    authService = {
      googleLogin: jest.fn(),
      toPublicUser: jest.fn((u) => u),
      issueProfileCompletionToken: jest.fn().mockReturnValue('profile-completion-token-123'),
      buildAuthResult: jest.fn((u) => ({ token: 'jwt-access-token', user: u })),
      completeProfile: jest.fn(),
    };
    oauthExchangeService = {
      issue: jest.fn().mockResolvedValue('opaque-code-123'),
      consume: jest.fn(),
    };
    controller = new AuthController(authService as never, oauthExchangeService as never, {} as never);
    res = { redirect: jest.fn(), cookie: jest.fn(), json: jest.fn().mockReturnThis() };
    process.env.FRONTEND_URL = 'https://app.colibri.test';
  });

  describe('getGoogleCallback', () => {
    it('redirige SOLO con ?code, nunca con tempToken, role, jwt o eyJ', async () => {
      authService.googleLogin.mockResolvedValue({ user: activeUser, requiresProfileCompletion: false });
      oauthExchangeService.issue.mockResolvedValue('opaque-code-123');

      const req = { user: googleUser } as never;
      await controller.getGoogleCallback(req, res as never as Response);

      expect(authService.googleLogin).toHaveBeenCalledWith(googleUser);
      expect(oauthExchangeService.issue).toHaveBeenCalledWith(activeUser);

      const redirectUrl = new URL(res.redirect.mock.calls[0][0]);
      expect(redirectUrl.searchParams.get('code')).toEqual('opaque-code-123');
      expect([...redirectUrl.searchParams.keys()]).toEqual(['code']);
      expect(redirectUrl.toString()).not.toMatch(/tempToken|role|jwt|eyJ/i);
      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('redirige con ?code también para usuario PENDING_PROFILE', async () => {
      authService.googleLogin.mockResolvedValue({ user: pendingUser, requiresProfileCompletion: true });
      oauthExchangeService.issue.mockResolvedValue('opaque-code-456');

      const req = { user: googleUser } as never;
      await controller.getGoogleCallback(req, res as never as Response);

      const redirectUrl = new URL(res.redirect.mock.calls[0][0]);
      expect(redirectUrl.searchParams.get('code')).toEqual('opaque-code-456');
      expect([...redirectUrl.searchParams.keys()]).toEqual(['code']);
      expect(res.cookie).not.toHaveBeenCalled();
    });
  });

  describe('exchangeGoogleCode', () => {
    it('con usuario ACTIVE setea cookie y no expone token en body', async () => {
      oauthExchangeService.consume.mockResolvedValue(activeUser);
      authService.buildAuthResult.mockReturnValue({ token: 'jwt-access-token', user: activeUser });

      const result = await controller.exchangeGoogleCode({ code: 'opaque-code-123' } as never, res as never as Response);

      expect(oauthExchangeService.consume).toHaveBeenCalledWith('opaque-code-123');
      expect(authService.buildAuthResult).toHaveBeenCalledWith(activeUser);
      expect(res.cookie).toHaveBeenCalledWith(
        'colibri_access_token',
        'jwt-access-token',
        expect.objectContaining({ httpOnly: true, path: '/' }),
      );

      expect(result.message).toEqual('Sesión iniciada con éxito');
      expect(result.user).toEqual(activeUser);
      expect(result.requiresProfileCompletion).toBe(false);
      expect(result.profileCompletionToken).toBeUndefined();
      expect(result.token).toBeUndefined();
    });

    it('con usuario PENDING_PROFILE devuelve profileCompletionToken y requiresProfileCompletion: true, sin cookie', async () => {
      oauthExchangeService.consume.mockResolvedValue(pendingUser);
      authService.toPublicUser.mockReturnValue(pendingUser);

      const result = await controller.exchangeGoogleCode({ code: 'opaque-code-456' } as never, res as never as Response);

      expect(oauthExchangeService.consume).toHaveBeenCalledWith('opaque-code-456');
      expect(authService.toPublicUser).toHaveBeenCalledWith(pendingUser);
      expect(authService.issueProfileCompletionToken).toHaveBeenCalledWith(pendingUser);
      expect(res.cookie).not.toHaveBeenCalled();

      expect(result.message).toEqual('Perfil pendiente de completar');
      expect(result.user).toEqual(pendingUser);
      expect(result.requiresProfileCompletion).toBe(true);
      expect(result.profileCompletionToken).toEqual('profile-completion-token-123');
    });
  });
});