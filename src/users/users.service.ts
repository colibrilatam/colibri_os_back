import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ICreateUser } from './interfaces/create-user.interface';
import { UserRepository } from './user.repository';
import { User, UserRole } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRoleChangeAudit } from './entities/user-role-change-audit.entity';
import { ChangeUserRoleDto } from './dtos/change-user-role.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    @InjectRepository(UserRoleChangeAudit)
    private readonly roleChangeAuditRepository: Repository<UserRoleChangeAudit>,
  ) {}
  async create(user: ICreateUser) {
    try {
      const userFound = await this.userRepository.findByEmail(user.email);
      if (userFound) {
        throw new BadRequestException('El email proporcionado ya se encuentra en uso');
      }
      return await this.userRepository.create(user);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al crear el usuario');
    }
  }

  async findByEmail(email: string) {
    return await this.userRepository.findByEmail(email);
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
    return await this.userRepository.deleteUser(id);
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

  async changeRole(targetUserId: string, changedByUserId: string, dto: ChangeUserRoleDto) {
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

  private assertSelfOrAdmin(
    targetUserId: string,
    principal: { userId: string; role: UserRole },
  ): void {
    if (principal.userId !== targetUserId && principal.role !== UserRole.ADMIN) {
      throw new ForbiddenException('No tenés permiso para operar sobre este usuario');
    }
  }
}
