import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, InternalServerErrorException, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { SessionsService } from './sessions/sessions.service';
import { ConfigService } from '@nestjs/config';
import { IGoogleUser } from './interfaces/googleUser.interface';
import { AuthProvider, User, UserRole, UserStatus } from 'src/users/entities/user.entity';
import { CompleteProfileDto } from './dto/complete-profile.dto';

describe('AuthService — CODE-006', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let sessionsService: jest.Mocked<SessionsService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@colibri.com',
    password: null,
    fullName: 'Test User',
    role: UserRole.ENTREPRENEUR,
    status: UserStatus.ACTIVE,
    sessionVersion: 1,
    provider: AuthProvider.GOOGLE,
    linkedinId: null,
    googleId: 'google-123',
    cryptoWallet: null,
    credentialsWallet: null,
    adnHash: null,
    bio: null,
    avatar: 'https://example.com/avatar.png',
    gender: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    projects: [],
    projectMembers: [],
    nftActor: null,
    nftPortfolio: [],
    nftTransfersSent: [],
    nftTransfersReceived: [],
  } as User;

  const mockPendingUser: User = {
    ...mockUser,
    id: 'user-2',
    email: 'pending@colibri.com',
    role: null,
    status: UserStatus.PENDING_PROFILE,
  } as User;

  const googleUser: IGoogleUser = {
    email: 'new@colibri.com',
    fullName: 'New Google User',
    googleId: 'google-new',
    avatar: 'https://example.com/new-avatar.png',
  } as IGoogleUser;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      completeProfile: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    sessionsService = {
      issueRefreshToken: jest.fn(),
      rotateRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
    } as unknown as jest.Mocked<SessionsService>;

    configService = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: SessionsService, useValue: sessionsService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('googleLogin', () => {
    it('con usuario ACTIVE existente → { requiresProfileCompletion: false, user }', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.googleLogin(googleUser);

      expect(usersService.findByEmail).toHaveBeenCalledWith(googleUser.email);
      expect(usersService.create).not.toHaveBeenCalled();
      expect(result.requiresProfileCompletion).toBe(false);
      expect(result.user).toEqual(mockUser);
    });

    it('con usuario PENDING_PROFILE existente → { requiresProfileCompletion: true, user }', async () => {
      usersService.findByEmail.mockResolvedValue(mockPendingUser);

      const result = await service.googleLogin(googleUser);

      expect(usersService.findByEmail).toHaveBeenCalledWith(googleUser.email);
      expect(usersService.create).not.toHaveBeenCalled();
      expect(result.requiresProfileCompletion).toBe(true);
      expect(result.user).toEqual(mockPendingUser);
    });

    it('con email nuevo → crea usuario PENDING_PROFILE', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockPendingUser);

      const result = await service.googleLogin(googleUser);

      expect(usersService.findByEmail).toHaveBeenCalledWith(googleUser.email);
      expect(usersService.create).toHaveBeenCalledWith({
        email: googleUser.email,
        fullName: googleUser.fullName,
        googleId: googleUser.googleId,
        password: null,
        avatar: googleUser.avatar,
        provider: AuthProvider.GOOGLE,
        role: null,
        status: UserStatus.PENDING_PROFILE,
      });
      expect(result.requiresProfileCompletion).toBe(true);
      expect(result.user).toEqual(mockPendingUser);
    });

    it('race condition: create falla, findByEmail retorna usuario ya creado → no lanza', async () => {
      usersService.findByEmail
        .mockResolvedValueOnce(null) // primera llamada: no existe
        .mockResolvedValueOnce(mockUser); // segunda llamada (tras catch): ya creado por otra request
      usersService.create.mockRejectedValue(new Error('unique constraint'));

      const result = await service.googleLogin(googleUser);

      expect(usersService.findByEmail).toHaveBeenCalledTimes(2);
      expect(usersService.create).toHaveBeenCalledTimes(1);
      expect(result.requiresProfileCompletion).toBe(false);
      expect(result.user).toEqual(mockUser);
    });

    it('race condition: create falla y findByEmail segunda vez también null → InternalServerErrorException', async () => {
      usersService.findByEmail
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      usersService.create.mockRejectedValue(new Error('unique constraint'));

      await expect(service.googleLogin(googleUser)).rejects.toBeInstanceOf(InternalServerErrorException);
      expect(usersService.findByEmail).toHaveBeenCalledTimes(2);
    });
  });

  describe('issueProfileCompletionToken', () => {
    it('genera JWT con purpose: profile-completion y sub correcto', () => {
      const token = 'profile-completion-jwt-token';
      jwtService.sign.mockReturnValue(token);

      const result = service.issueProfileCompletionToken(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: mockUser.id, purpose: 'profile-completion' },
        { expiresIn: '1h' },
      );
      expect(result).toBe(token);
    });
  });

  describe('toPublicUser', () => {
    it('incluye solo campos públicos esperados', () => {
      const result = service.toPublicUser(mockUser);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        role: mockUser.role,
        status: mockUser.status,
      });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('sessionVersion');
      expect(result).not.toHaveProperty('googleId');
    });
  });

  describe('buildAuthResult', () => {
    it('devuelve token y usuario público', () => {
      const token = 'access-token';
      jwtService.sign.mockReturnValue(token);

      const result = service.buildAuthResult(mockUser);

      expect(result.token).toBe(token);
      expect(result.user).toEqual(service.toPublicUser(mockUser));
    });
  });

  describe('completeProfile', () => {
    const dto: CompleteProfileDto = {
      role: UserRole.ENTREPRENEUR,
      gender: 'male' as any,
      profileCompletionToken: 'valid-token',
    };

    it('con token sin purpose → UnauthorizedException', async () => {
      jwtService.verify.mockReturnValue({ sub: 'user-1', purpose: 'wrong-purpose' });

      await expect(service.completeProfile(dto)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(jwtService.verify).toHaveBeenCalledWith(dto.profileCompletionToken);
    });

    it('con token expirado → UnauthorizedException', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      await expect(service.completeProfile(dto)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('con token válido → llama a userService.completeProfile y devuelve token + user', async () => {
      const updatedUser = { ...mockUser, role: UserRole.ENTREPRENEUR };
      jwtService.verify.mockReturnValue({ sub: mockUser.id, purpose: 'profile-completion' });
      usersService.completeProfile.mockResolvedValue(updatedUser);
      jwtService.sign.mockReturnValue('new-access-token');

      const result = await service.completeProfile(dto);

      expect(jwtService.verify).toHaveBeenCalledWith(dto.profileCompletionToken);
      expect(usersService.completeProfile).toHaveBeenCalledWith(mockUser.id, dto.role, dto.gender);
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result.token).toBe('new-access-token');
      expect(result.user).toEqual(service.toPublicUser(updatedUser));
    });
  });
});