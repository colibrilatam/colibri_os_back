import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { NftActor } from "../entities/nft-actor.entity";
import { Repository } from "typeorm";
import { ICreateNftActor } from "./interfaces/create-nft-actor.interface";
import { IUpdateNftActor } from "./interfaces/update-nft-actor.interface";

@Injectable()
export class NftActorRepository {
    constructor(
        @InjectRepository(NftActor) private readonly nftActorRepository: Repository<NftActor>,
    ) {}

    async createNftActor(nftActor: ICreateNftActor): Promise<NftActor> {
        return await this.nftActorRepository.save(nftActor);
    }

    async findByUserId(userId: string){
        return await this.nftActorRepository.findOne({where:{userId}, relations: ['user']})
    }

    async findById(id: string){
        return await this.nftActorRepository.findOne({where:{id}, relations: ['user']})
    }

    async updateNftActor(id: string, data: IUpdateNftActor){
        await this.nftActorRepository.update({id}, data)
    }
}