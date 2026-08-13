import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NftActorRepository } from './nft-actor.repository';
import { UsersService } from 'src/users/users.service';
import { ICreateNftActor } from './interfaces/create-nft-actor.interface';
import { IUpdateNftActor } from './interfaces/update-nft-actor.interface';
import { UserRole } from 'src/users/entities/user.entity';
import { NftActor } from '../entities/nft-actor.entity';
import { NftResourceAudit, NftAuditResourceType } from '../entities/nft-resource-audit.entity';

export interface NftResourcePrincipal {
  userId: string;
  role: UserRole;
}

@Injectable()
export class NftActorService {
  constructor(
    private readonly nftActorRepository: NftActorRepository,
    private readonly userService: UsersService,
    @InjectRepository(NftResourceAudit)
    private readonly auditRepository: Repository<NftResourceAudit>,
  ) {}

  async createNftActor(nftActor: ICreateNftActor) {
    const user = await this.userService.findOneById(nftActor.userId);
    const userNftActor = await this.nftActorRepository.findByUserId(user.id);
    if (userNftActor) throw new ConflictException('El usuario ya tiene un NFT Actor asociado');
    return await this.nftActorRepository.createNftActor({ ...nftActor, userId: user.id });
  }

  async findByUserId(userId: string) {
    const nftActor = await this.nftActorRepository.findByUserId(userId);
    if (!nftActor) throw new NotFoundException('NFT Actor no encontrado');
    const { password, ...nftActorData } = nftActor.user;
    return { ...nftActor, user: nftActorData };
  }

  async findById(id: string) {
    const nftActor = await this.nftActorRepository.findById(id);
    if (!nftActor) throw new NotFoundException('NFT Actor no encontrado');
    const { password, ...nftActorData } = nftActor.user;
    return { ...nftActor, user: nftActorData };
  }

  /**
   * SEC-006C: solo el propietario del NFT Actor o un ADMIN pueden modificarlo.
   * Además se valida que el actor tenga una wallet vinculada a su identidad
   * (cryptoWallet del usuario dueño) antes de permitir la modificación,
   * y la operación queda auditada.
   */
  async updateNftActor(id: string, data: IUpdateNftActor, principal: NftResourcePrincipal) {
    const nftActor = await this.assertOwnershipAndWallet(id, principal);

    await this.nftActorRepository.updateNftActor(nftActor.id, data);

    await this.auditRepository.save(
      this.auditRepository.create({
        resourceType: NftAuditResourceType.NFT_ACTOR,
        resourceId: nftActor.id,
        performedByUserId: principal.userId,
        ownerUserId: nftActor.userId,
        changes: data as Record<string, unknown>,
      }),
    );

    return { message: 'NFT Actor actualizado correctamente' };
  }

  private async assertOwnershipAndWallet(
    id: string,
    principal: NftResourcePrincipal,
  ): Promise<NftActor> {
    const nftActor = await this.nftActorRepository.findById(id);
    if (!nftActor) throw new NotFoundException('NFT Actor no encontrado');

    const isOwner = nftActor.userId === principal.userId;
    const isAdmin = principal.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('No tenés permiso para modificar este NFT Actor');
    }

    if (!nftActor.user?.cryptoWallet) {
      throw new ForbiddenException(
        'El NFT Actor no tiene una wallet vinculada a la identidad del titular',
      );
    }

    return nftActor;
  }
}