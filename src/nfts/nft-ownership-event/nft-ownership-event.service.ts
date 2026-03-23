import { Injectable } from "@nestjs/common";
import { NftOwnershipEventRepository } from "./nft-ownership-event.repository";
import { ICreateNftOwnershipEvent } from "./interfaces/create-nft-ownership.interface";
import { NftProjectService } from "../nft-project/nfts-project.service";

@Injectable()
export class NftOwnershipEventService {
    constructor(
        private readonly nftOwnershipEventRepository: NftOwnershipEventRepository,
        private readonly nftProjectService: NftProjectService
    ){}

    async create(data: ICreateNftOwnershipEvent){
        const nftProject = await this.nftProjectService.findOne(data.nftProjectId);
        return await this.nftOwnershipEventRepository.create({...data, nftProjectId: nftProject.id});
    }

    async findByNftProjectId(nftProjectId: string){
        const nftProject = await this.nftOwnershipEventRepository.findByNftProjectId(nftProjectId);
        return nftProject;
    }

    async findByUserId(userId: string){
        const events = await this.nftOwnershipEventRepository.findByUserId(userId);
        return events;     
    
    }
}