import { UnauthorizedException } from '@nestjs/common';
import { OAuthExchangeService } from './oauth-exchange.service';
import { UserStatus, type User } from '../../users/entities/user.entity';

describe('OAuthExchangeService', () => {
  let userRepository: { findOneBy: jest.Mock };
  let exchangeCodeRepository: { create: jest.Mock; save: jest.Mock; findOneBy: jest.Mock };
  let configService: { get: jest.Mock };
  let service: OAuthExchangeService;

  const activeUser = { id: 'user-1', status: UserStatus.ACTIVE } as User;

  beforeEach(() => {
    userRepository = { findOneBy: jest.fn().mockResolvedValue(activeUser) };
    exchangeCodeRepository = {
      create: jest.fn((entity) => entity),
      save: jest.fn((entity) => Promise.resolve(entity)),
      findOneBy: jest.fn(),
    };
    configService = { get: jest.fn().mockReturnValue(undefined) };
    service = new OAuthExchangeService(
      userRepository as never,
      exchangeCodeRepository as never,
      configService as never,
    );
  });

  it('emite un código opaco y solo persiste su hash (nunca el código crudo)', async () => {
    const code = await service.issue(activeUser);

    expect(code).toEqual(expect.any(String));
    const persisted = exchangeCodeRepository.save.mock.calls[0][0];
    expect(persisted.codeHash).not.toEqual(code);
    expect(persisted.usedAt).toBeNull();
    expect(persisted.userId).toEqual(activeUser.id);
  });

  it('canjea un código válido y devuelve el usuario asociado', async () => {
    const code = await service.issue(activeUser);
    const stored = exchangeCodeRepository.save.mock.calls[0][0];
    exchangeCodeRepository.findOneBy.mockResolvedValue(stored);

    await expect(service.consume(code)).resolves.toEqual(activeUser);
    expect(stored.usedAt).not.toBeNull();
  });

  it('rechaza reutilizar un código ya canjeado (replay)', async () => {
    const code = await service.issue(activeUser);
    const stored = exchangeCodeRepository.save.mock.calls[0][0];
    exchangeCodeRepository.findOneBy.mockResolvedValue(stored);

    await service.consume(code); // primer canje: OK
    await expect(service.consume(code)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza un código expirado', async () => {
    const code = await service.issue(activeUser);
    const stored = exchangeCodeRepository.save.mock.calls[0][0];
    stored.expiresAt = new Date(Date.now() - 1000);
    exchangeCodeRepository.findOneBy.mockResolvedValue(stored);

    await expect(service.consume(code)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza un código inexistente', async () => {
    exchangeCodeRepository.findOneBy.mockResolvedValue(null);

    await expect(service.consume('codigo-inexistente')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rechaza el canje si el usuario ya no está activo', async () => {
    const code = await service.issue(activeUser);
    const stored = exchangeCodeRepository.save.mock.calls[0][0];
    exchangeCodeRepository.findOneBy.mockResolvedValueOnce(stored);
    userRepository.findOneBy.mockResolvedValue({ ...activeUser, status: UserStatus.SUSPENDED });

    await expect(service.consume(code)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});