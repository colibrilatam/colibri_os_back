import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { NftOwnershipEvent } from "../entities/nft-ownership-event.entity";
import { Repository} from "typeorm";
import { ICreateNftOwnershipEvent } from "./interfaces/create-nft-ownership.interface";

@Injectable()
export class NftOwnershipEventRepository {
    constructor(@InjectRepository(NftOwnershipEvent) private readonly nftOwnershipEventRepository: Repository<NftOwnershipEvent>){}

    async create(data: ICreateNftOwnershipEvent){
        const event = await this.nftOwnershipEventRepository.create(data);
        return await this.nftOwnershipEventRepository.save(event);
    }

    async findByNftProjectId(nftProjectId: string){
        return await this.nftOwnershipEventRepository.find({
            where: { nftProjectId },
            relations: ['fromUser', 'toUser']
        });
    }

    async findByUserId(userId: string){
        return await this.nftOwnershipEventRepository.find({
            where: [
                { fromUserId: userId },
                { toUserId: userId }
            ],
            relations: ['fromUser', 'toUser']
        });
    }
    
}