import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MecenasNftPortfolioRepository } from './mecenas-nft-portfolio.repository';
import { ICreateMecenasNft } from './interfaces/create-mecenas-nft.interface';
import { IUpdateMecenasNft } from './interfaces/update-mecenas-nft.interface';
import { UsersService } from 'src/users/users.service';
import { NftProjectService } from '../nft-project/nfts-project.service';
import { ProjectsService } from 'src/projects/projects.service';
import { UserRole } from 'src/users/entities/user.entity';
import { MecenasNftPortfolio } from '../entities/mecenas-nft-portfolio.entity';
import { NftResourceAudit, NftAuditResourceType } from '../entities/nft-resource-audit.entity';

export interface NftResourcePrincipal {
  userId: string;
  role: UserRole;
}

@Injectable()
export class MecenasNftPortfolioService {
  constructor(
    private readonly mecenasNftRepository: MecenasNftPortfolioRepository,
    private readonly userService: UsersService,
    private readonly nftProjectService: NftProjectService,
    private readonly projectService: ProjectsService,
    @InjectRepository(NftResourceAudit)
    private readonly auditRepository: Repository<NftResourceAudit>,
  ) {}

  async createMecenasNft(data: ICreateMecenasNft) {
    const user = await this.userService.findOneById(data.mecenasUserId);
    const portfolio = await this.mecenasNftRepository.findByNftProjectId(data.nftProjectId);
    const nftProject = await this.nftProjectService.findOne(data.nftProjectId);
    if (portfolio && !portfolio.releasedAt) {
      throw new ConflictException('El NFT ya está en el portafolio de un mecenas');
    }

    if (data.targetProjectId) {
      await this.projectService.findOne(data.targetProjectId);
    }
    return await this.mecenasNftRepository.createMecenasNft({
      ...data,
      mecenasUserId: user.id,
      nftProjectId: nftProject.id,
    });
  }

  async findByMecenasId(mecenasUserId: string) {
    const portfolio = await this.mecenasNftRepository.findByMecenasId(mecenasUserId);
    if (portfolio.length === 0)
      throw new NotFoundException('No se encontraron NFTs en el portafolio de este mecenas');
    return portfolio;
  }

  async findByNftProjectId(nftProjectId: string) {
    const project = await this.mecenasNftRepository.findByNftProjectId(nftProjectId);
    if (!project)
      throw new NotFoundException('No se encontró un portafolio para este proyecto de NFT');
    return project;
  }

  /**
   * SEC-006C: solo el mecenas dueño de la entrada de portafolio (o un ADMIN)
   * puede modificarla. Se valida que tenga wallet vinculada a su identidad y,
   * si se reasigna `targetProjectId`, que el usuario tenga una relación
   * autorizada con ese proyecto (dueño, miembro activo, o ADMIN).
   * La operación queda auditada.
   */
  async updateMecenasNft(id: string, data: IUpdateMecenasNft, principal: NftResourcePrincipal) {
    const portfolio = await this.assertOwnershipAndWallet(id, principal);

    if (data.targetProjectId) {
      await this.assertProjectRelation(data.targetProjectId, principal);
    }

    await this.mecenasNftRepository.updateMecenasNft(portfolio.id, data);

    await this.auditRepository.save(
      this.auditRepository.create({
        resourceType: NftAuditResourceType.MECENAS_PORTFOLIO,
        resourceId: portfolio.id,
        performedByUserId: principal.userId,
        ownerUserId: portfolio.mecenasUserId,
        changes: data as Record<string, unknown>,
      }),
    );

    return { message: 'Portafolio de NFT actualizado correctamente' };
  }

  async findById(id: string) {
    const portfolio = await this.mecenasNftRepository.findById(id);
    if (!portfolio) throw new NotFoundException('No se encontró el portafolio de mecenas NFT');
    return portfolio;
  }

  private async assertOwnershipAndWallet(
    id: string,
    principal: NftResourcePrincipal,
  ): Promise<MecenasNftPortfolio> {
    const portfolio = await this.mecenasNftRepository.findById(id);
    if (!portfolio) throw new NotFoundException('No se encontró el portafolio de mecenas NFT');

    const isOwner = portfolio.mecenasUserId === principal.userId;
    const isAdmin = principal.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('No tenés permiso para modificar este portafolio de NFT');
    }

    const owner = await this.userService.findOneById(portfolio.mecenasUserId);
    if (!owner.cryptoWallet) {
      throw new ForbiddenException(
        'El mecenas no tiene una wallet vinculada a su identidad; no se puede modificar el portafolio',
      );
    }

    return portfolio;
  }

  private async assertProjectRelation(
    targetProjectId: string,
    principal: NftResourcePrincipal,
  ): Promise<void> {
    const project = await this.projectService.findOne(targetProjectId);

    if (principal.role === UserRole.ADMIN || project.ownerUserId === principal.userId) {
      return;
    }

    const hasActiveMembership = (project.members ?? []).some(
      (member) => member.userId === principal.userId && member.isActive,
    );

    if (!hasActiveMembership) {
      throw new ForbiddenException('No tenés una relación autorizada con el proyecto destino');
    }
  }
}