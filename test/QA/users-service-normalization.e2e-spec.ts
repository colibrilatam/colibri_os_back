import { BadRequestException } from '@nestjs/common';

import { AuthProvider, UserRole } from '../../src/users/entities/user.entity';
import { UsersService } from '../../src/users/users.service';

describe('UsersService - normalizacion de email (QA-AUD-002)', () => {
  let userRepository: any;
  let roleChangeAuditRepository: any;
  let service: UsersService;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findOneByID: jest.fn(),
      findAll: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    };

    roleChangeAuditRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    service = new UsersService(userRepository, roleChangeAuditRepository);
  });

  it('trimea y baja a minusculas antes de buscar o crear', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockImplementation(async (user: any) => user);

    await service.create({
      email: '  MiUsuario@Example.com  ',
      fullName: 'Usuario Auditado',
      password: 'hashed-password',
      provider: AuthProvider.LOCAL,
      role: UserRole.ENTREPRENEUR,
    });

    expect(userRepository.findByEmail).toHaveBeenCalledWith('miusuario@example.com');
    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'miusuario@example.com',
      }),
    );
  });

  it('rechaza un email duplicado sin importar el casing', async () => {
    userRepository.findByEmail.mockResolvedValue({ id: 'existing-user' });

    await expect(
      service.create({
        email: 'Audit.User@Example.com',
        fullName: 'Usuario Auditado',
        password: 'hashed-password',
        provider: AuthProvider.LOCAL,
        role: UserRole.ENTREPRENEUR,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(userRepository.findByEmail).toHaveBeenCalledWith('audit.user@example.com');
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('normaliza el email en findByEmail', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await service.findByEmail('  Audit.User@Example.com  ');

    expect(userRepository.findByEmail).toHaveBeenCalledWith('audit.user@example.com');
  });
});
