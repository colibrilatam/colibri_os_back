import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { NftActorRepository } from "./nft-actor.repository";
import { UsersService } from "src/users/users.service";
import { ICreateNftActor } from "./interfaces/create-nft-actor.interface";
import { IUpdateNftActor } from "./interfaces/update-nft-actor.interface";

@Injectable()
export class NftActorService {
    constructor(
        private readonly nftActorRepository: NftActorRepository,
        private readonly userService: UsersService
    ) { }

    async createNftActor(nftActor: ICreateNftActor) {
        const user = await this.userService.findOneById(nftActor.userId)
        const userNftActor = await this.nftActorRepository.findByUserId(user.id)
        if (userNftActor) throw new ConflictException('El usuario ya tiene un NFT Actor asociado')
        return await this.nftActorRepository.createNftActor({ ...nftActor, userId: user.id })
    }

    async findByUserId(userId: string) {
        const nftActor = await this.nftActorRepository.findByUserId(userId)
        if (!nftActor) throw new NotFoundException('NFT Actor no encontrado')
        const { password, ...nftActorData } = nftActor.user
        return { ...nftActor, user: nftActorData }
    }

    async findById(id: string) {
        const nftActor = await this.nftActorRepository.findById(id)
        if (!nftActor) throw new NotFoundException('NFT Actor no encontrado')
        const { password, ...nftActorData } = nftActor.user
        return { ...nftActor, user: nftActorData }
    }

    async updateNftActor(id: string, data: IUpdateNftActor) {
        const nftActor = await this.findById(id)
        await this.nftActorRepository.updateNftActor(nftActor.id, data)
        return { message: 'NFT Actor actualizado correctamente' }
    }
}