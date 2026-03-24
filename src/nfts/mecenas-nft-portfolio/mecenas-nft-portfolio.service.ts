import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { MecenasNftPortfolioRepository } from "./mecenas-nft-portfolio.repository";
import { ICreateMecenasNft } from "./interfaces/create-mecenas-nft.interface";
import { IUpdateMecenasNft } from "./interfaces/update-mecenas-nft.interface";
import { UsersService } from "src/users/users.service";
import { NftProjectService } from "../nft-project/nfts-project.service";

@Injectable()
export class MecenasNftPortfolioService {
    constructor(
        private readonly mecenasNftRepository: MecenasNftPortfolioRepository,
        private readonly userService: UsersService,
        private readonly nftProjectService: NftProjectService
    ) { }

    async createMecenasNft(data: ICreateMecenasNft) {
        const user = await this.userService.findOneById(data.mecenasUserId);
        const portfolio = await this.mecenasNftRepository.findByNftProjectId(data.nftProjectId);
        const nftProject = await this.nftProjectService.findOne(data.nftProjectId);
        if (portfolio && !portfolio.releasedAt)throw new ConflictException('El NFT ya está en el portafolio de un mecenas')
        return await this.mecenasNftRepository.createMecenasNft({ ...data, mecenasUserId: user.id, nftProjectId: nftProject.id });
    }

    async findByMecenasId(mecenasUserId: string) {
        const portfolio = await this.mecenasNftRepository.findByMecenasId(mecenasUserId);
        if (portfolio.length === 0) throw new NotFoundException('No se encontraron NFTs en el portafolio de este mecenas')
        return portfolio;
    }

    async findByNftProjectId(nftProjectId: string) {
        const project = await this.mecenasNftRepository.findByNftProjectId(nftProjectId);
        if (!project) throw new NotFoundException('No se encontró un portafolio para este proyecto de NFT')
        return project;
    }

    async updateMecenasNft(id: string, data: IUpdateMecenasNft) {
        const portfolio = await this.mecenasNftRepository.findById(id);
        if (!portfolio) throw new NotFoundException('No se encontró el portafolio de mecenas NFT');
        await this.mecenasNftRepository.updateMecenasNft(portfolio.id, data);
    }
}