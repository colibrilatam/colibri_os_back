import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { ICreateUser } from './interfaces/create-user.interface';
import { UserRepository } from './user.repository';
import { User, UserRole, Gender, UserStatus } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRoleChangeAudit } from './entities/user-role-change-audit.entity';
import { ChangeUserRoleDto } from './dtos/change-user-role.dto';
import { ChangeUserStatusDto } from './dtos/change-user-status.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { SessionsService } from '../auth/sessions/sessions.service';

@Injectable()
export class UsersService {
  constructor(
    
    private readonly userRepository: UserRepository,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(UserRoleChangeAudit)
    private readonly roleChangeAuditRepository: Repository<UserRoleChangeAudit>,
    private readonly sessionsService: SessionsService,
  ) {}

  async create(user: ICreateUser) {
    try {
      const email = this.normalizeEmail(user.email);
      const userFound = await this.userRepository.findByEmail(email);
      if (userFound) {
        throw new BadRequestException('El email proporcionado ya se encuentra en uso');
      }
      return await this.userRepository.create({ ...user, email });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al crear el usuario');
    }
  }

  async findByEmail(email: string) {
    return await this.userRepository.findByEmail(this.normalizeEmail(email));
  }

  async findAll() {
    return await this.userRepository.findAll();
  }

  async findOneById(id: string) {
    const userFound = await this.userRepository.findOneByID(id);
    if (!userFound) {
      throw new NotFoundException('Usuario no encontrado');
    }
    const { password, ...userData } = userFound;
    return userData;
  }

  async update(
    id: string,
    principal: { userId: string; role: UserRole },
    updateUserDto: Partial<User>,
  ) {
    this.assertSelfOrAdmin(id, principal);
    const userFound = await this.userRepository.findOneByID(id);
    if (!userFound) {
      throw new NotFoundException('Usuario no encontrado');
    }
    await this.userRepository.updateUser(id, updateUserDto);
    return { message: 'Usuario actualizado correctamente' };
  }

  async remove(id: string, principal: { userId: string; role: UserRole }) {
    this.assertSelfOrAdmin(id, principal);
    const userFound = await this.userRepository.findOneByID(id);
    if (!userFound) {
      throw new NotFoundException('Usuario no encontrado');
    }
    const result = await this.userRepository.deleteUser(id);

    // Desactivar es un evento crítico: invalida de inmediato cualquier
    // access/refresh token que el usuario ya tuviera.
    await this.sessionsService.bumpSessionVersion(id);

    return result;
  }

  async findOneAuthorized(id: string, principal: { userId: string; role: UserRole }) {
    this.assertSelfOrAdmin(id, principal);
    return this.findOneById(id);
  }

  async findAllAuthorized(principal: { role: UserRole }) {
    if (principal.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo un administrador puede listar usuarios');
    }
    return this.findAll();
  }

  async changeRole(
    targetUserId: string,
    changedByUserId: string,
    dto: ChangeUserRoleDto,
    principal: { userId: string; role: UserRole },
  ) {
    this.assertAdmin(principal);

    const targetUser = await this.userRepository.findOneByID(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (targetUser.role === dto.role) {
      throw new BadRequestException('El usuario ya tiene ese rol');
    }

    const previousRole = targetUser.role;
    targetUser.role = dto.role;

    await this.userRepository.updateUser(targetUserId, { role: dto.role });
    await this.roleChangeAuditRepository.save(
      this.roleChangeAuditRepository.create({
        targetUserId,
        changedByUserId,
        previousRole,
        nextRole: dto.role,
        reason: dto.reason,
      }),
    );

    return this.findOneById(targetUserId);
  }

  async completeProfile(userId: string, role: UserRole, gender: Gender) {
  const user = await this.userRepository.findOneByID(userId);
  if (!user) {
    throw new NotFoundException('Usuario no encontrado');
  }
  if (user.status !== UserStatus.PENDING_PROFILE) {
    throw new BadRequestException('El usuario no está en estado pendiente de perfil');
  }
  user.role = role;
  user.gender = gender;
  user.status = UserStatus.ACTIVE;
  await this.userRepo.save(user);
  return user;
}

  /**
   * Suspende, desactiva o reactiva a un usuario. Cambiar el estado a algo
   * distinto de "active" es un evento crítico: revoca de inmediato
   * cualquier sesión (access y refresh token) que el usuario ya tuviera.
   */
  async changeStatus(
    targetUserId: string,
    dto: ChangeUserStatusDto,
    principal: { userId: string; role: UserRole },
  ) {
    this.assertAdmin(principal);

    const targetUser = await this.userRepository.findOneByID(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (targetUser.status === dto.status) {
      throw new BadRequestException('El usuario ya tiene ese estado');
    }

    await this.userRepository.updateUser(targetUserId, { status: dto.status });

    if (dto.status !== UserStatus.ACTIVE) {
      await this.sessionsService.bumpSessionVersion(targetUserId);
    }

    return this.findOneById(targetUserId);
  }

  /**
   * Cambio de contraseña del propio usuario autenticado. Revoca todas
   * las sesiones anteriores (access + refresh tokens).
   */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('Las contraseñas nuevas deben ser iguales');
    }

    const userFound = await this.userRepository.findOneByID(userId);
    if (!userFound) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (!userFound.password) {
      throw new BadRequestException(
        'Esta cuenta inicia sesión con Google y no tiene contraseña local',
      );
    }

    const isValidPassword = await bcrypt.compare(dto.currentPassword, userFound.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.updateUser(userId, { password: newPasswordHash });

    await this.sessionsService.bumpSessionVersion(userId);

    return { message: 'Contraseña actualizada correctamente. Las demás sesiones fueron cerradas.' };
  }

  private assertSelfOrAdmin(
    targetUserId: string,
    principal: { userId: string; role: UserRole },
  ): void {
    if (principal.userId !== targetUserId && principal.role !== UserRole.ADMIN) {
      throw new ForbiddenException('No tenés permiso para operar sobre este usuario');
    }
  }

  private assertAdmin(principal: { userId: string; role: UserRole }): void {
    if (principal.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo un administrador puede realizar esta acción');
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}