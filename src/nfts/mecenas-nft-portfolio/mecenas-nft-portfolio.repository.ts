import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MecenasNftPortfolio } from "../entities/mecenas-nft-portfolio.entity";
import { Repository } from "typeorm";
import { ICreateMecenasNft } from "./interfaces/create-mecenas-nft.interface";
import { IUpdateMecenasNft } from "./interfaces/update-mecenas-nft.interface";

@Injectable()
export class MecenasNftPortfolioRepository{
    constructor(@InjectRepository(MecenasNftPortfolio) private readonly mecenasNftPortfolioRepository: Repository<MecenasNftPortfolio>) {}

    async createMecenasNft(data: ICreateMecenasNft){
        const mecenasNft = this.mecenasNftPortfolioRepository.create(data);
        return await this.mecenasNftPortfolioRepository.save(mecenasNft);
    }

    async findByMecenasId(mecenasUserId: string){
        return await this.mecenasNftPortfolioRepository.find({where: {mecenasUserId}, relations: ['mecenas', 'nftProject']})
    }

    async findByNftProjectId(nftProjectId: string){
        return await this.mecenasNftPortfolioRepository.findOne({where: {nftProjectId}, relations: ['mecenas', 'nftProject']})
    }

    async updateMecenasNft(id:string, data: IUpdateMecenasNft){
        await this.mecenasNftPortfolioRepository.update(id, data);
    }

    async findById(id: string){
        return await this.mecenasNftPortfolioRepository.findOne({where: {id}, relations: ['mecenas', 'nftProject']})
    }
}
