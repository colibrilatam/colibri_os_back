import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ICreateUser } from './interfaces/create-user.interface';
import { UserRepository } from './user.repository';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) { }
  async create(user: ICreateUser) {
    try {
      const userFound = await this.userRepository.findByEmail(user.email)
      if (userFound) {
        throw new BadRequestException('El email proporcionado ya se encuentra en uso')
      }
      return await this.userRepository.create(user)
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al crear el usuario')
    }
  }

  async findByEmail(email: string) {
    return await this.userRepository.findByEmail(email);
  }

  async findAll() {
    return await this.userRepository.findAll();
  }

  async findOneById(id: string) {
    const userFound = await this.userRepository.findOneByID(id)
    if (!userFound) {
      throw new NotFoundException('Usuario no encontrado')
    }
    const { password, ...userData } = userFound
    return userData;
  }

  async update(id: string, updateUserDto: Partial<User>) {
    const userFound = await this.userRepository.findOneByID(id)
    if (!userFound) {
      throw new NotFoundException('Usuario no encontrado')
    }
    await this.userRepository.updateUser(id, updateUserDto)
    return { message: 'Usuario actualizado correctamente' }
  }

  async remove(id: string) {
    const userFound = await this.userRepository.findOneByID(id)
    if (!userFound) {
      throw new NotFoundException('Usuario no encontrado')
    }
    return await this.userRepository.deleteUser(id)
  }
}
