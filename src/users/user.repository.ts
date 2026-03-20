import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Repository } from "typeorm";
import { ICreateUser } from "./interfaces/create-user.interface";

@Injectable()
export class UserRepository{
    constructor(@InjectRepository(User) private readonly userRepository: Repository<User>){}

    async create(user: ICreateUser): Promise<User> {
        const newUSer = this.userRepository.create(user)
        return await this.userRepository.save(newUSer)
    }

    async findByEmail(email:string): Promise<User | null>{
        const userFound = await this.userRepository.findOneBy({email})
        return userFound
    }
}