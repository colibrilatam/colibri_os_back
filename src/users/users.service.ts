import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ICreateUser } from './interfaces/create-user.interface';
import { UserRepository } from './user.repository';

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

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
