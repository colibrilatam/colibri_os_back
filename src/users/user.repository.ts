import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User, UserStatus } from "./entities/user.entity";
import { Repository } from "typeorm";
import { ICreateUser } from "./interfaces/create-user.interface";

@Injectable()
export class UserRepository {
    constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) { }

    async create(user: ICreateUser): Promise<User> {
        const newUSer = this.userRepository.create(user)
        return await this.userRepository.save(newUSer)
    }

    async findByEmail(email: string): Promise<User | null> {
        const userFound = await this.userRepository.findOneBy({ email })
        return userFound
    }

    async findAll(): Promise<User[]> {
        return await this.userRepository.find()
    }

    async findOneByID(id: string) {
        return await this.userRepository.findOneBy({ id })
    }

    async updateUser(id: string, user: Partial<User>) {
        let userFound = await this.userRepository.findOneBy({ id })
        userFound = {...userFound, ...user} as User
        return await this.userRepository.save(userFound)
    }

    async deleteUser(id: string) {
        const user = await this.userRepository.findOneBy({ id })
        await this.userRepository.save({ ...user, status: UserStatus.INACTIVE })
    }
}