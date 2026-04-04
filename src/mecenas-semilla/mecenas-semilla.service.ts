import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { NftActorService } from '../nfts/nft-actor/nft-actor.service';
import { NftProjectService } from '../nfts/nft-project/nfts-project.service';
import { MecenasNftPortfolioService } from '../nfts/mecenas-nft-portfolio/mecenas-nft-portfolio.service';
import { ActorNftType } from '../nfts/entities/nft-actor.entity';
import { UserRole } from '../users/entities/user.entity';
import { MecenasSemillaRepository } from './mecenas-semilla.repository';
import { MecenasNftPortfolio } from 'src/nfts/entities/mecenas-nft-portfolio.entity';

@Injectable()
export class MecenasSemillaService {
  constructor(
    private readonly mecenasRepository: MecenasSemillaRepository,
    private readonly usersService: UsersService,
    private readonly nftActorService: NftActorService,
    private readonly nftProjectService: NftProjectService,
    private readonly portfolioService: MecenasNftPortfolioService,
  ) { }

  async activateMecenas(userId: string) {
    const user = await this.usersService.findOneById(userId);
    if (user.role === UserRole.MECENAS_SEMILLA) {
      throw new ConflictException('El usuario ya está activado como Mecenas Aliado Semilla');
    }

    const existingNftActor = await this.nftActorService
      .findByUserId(userId)
      .catch(() => null);

    if (existingNftActor) {
      throw new ConflictException('El usuario ya tiene un NFT de acreditación emitido');
    }
    await this.mecenasRepository.updateUserRole(userId);

    // Emitir NFT intransferible de acreditación (simulado en MVP)
    await this.nftActorService.createNftActor({
      userId,
      actorNftType: ActorNftType.MECENAS,
      chainId: 0,
      contractAddress: 'PENDING_BLOCKCHAIN',
      tokenId: `MECENAS-${userId}`,
    });

    return { message: 'Mecenas Aliado Semilla activado correctamente' };
  }

  async getDashboard(mecenasUserId: string) {
    await this.usersService.findOneById(mecenasUserId);

    const [summary, allPortfolios] = await Promise.all([
      this.mecenasRepository.getPortfolioSummary(mecenasUserId),
      this.portfolioService.findByMecenasId(mecenasUserId).catch(() => []),
    ]);

    // ← filtrar solo los que tienen proyecto asignado
    const sponsoredProjects = allPortfolios
      .filter((p) => p.targetProjectId !== null)
      .map((p) => p.targetProject);

    return {
      totalNfts: summary.total,
      assignedNfts: summary.assigned,
      availableNfts: summary.available,
      sponsoredProjects,
    };
  }


  async buyNfts(mecenasUserId: string, quantity: number) {
    if (quantity < 1) {
      throw new BadRequestException('La cantidad debe ser al menos 1');
    }
    const user = await this.usersService.findOneById(mecenasUserId);
    if (user.role !== UserRole.MECENAS_SEMILLA) {
      throw new ConflictException('El usuario no está activado como Mecenas Aliado Semilla');
    }

    const created: MecenasNftPortfolio[] = [];
    for (let i = 0; i < quantity; i++) {
      const nftProject = await this.nftProjectService.createSimulated(mecenasUserId, i);

      const portfolio = await this.portfolioService.createMecenasNft({
        mecenasUserId,
        nftProjectId: nftProject.id,
        targetProjectId: null,
      });

      created.push(portfolio);
    }

    return {
      message: `${quantity} NFT(s) Colibrí adquiridos correctamente`,
      acquired: created.length,
    };
  }

  // ─── PASO 4: Exploración de proyectos ───────────────────────────────────────

  async getProjects(mecenasUserId: string) {
    const [eligible, sponsored] = await Promise.all([
      this.mecenasRepository.findEligibleProjects(),
      this.portfolioService.findByMecenasId(mecenasUserId).catch(() => []),
    ]);

    return {
      eligibleProjects: eligible,
      sponsoredProjects: sponsored
        .filter((p) => p.targetProjectId !== null)
        .map((p) => p.targetProject),
    };
  }

  async assignNft(mecenasUserId: string, portfolioId: string, projectId: string) {
    const portfolio = await this.portfolioService
      .findById(portfolioId)
      .catch(() => null);

    if (!portfolio) throw new NotFoundException('NFT de portafolio no encontrado');
    if (portfolio.mecenasUserId !== mecenasUserId) {
      throw new ConflictException('Este NFT no pertenece al mecenas');
    }
    if (portfolio.targetProjectId !== null) {
      throw new ConflictException('Este NFT ya fue asignado a un proyecto');
    }

    const nftProject = await this.nftProjectService
      .findByProject(projectId)
      .catch(() => null);

    if (!nftProject) {
      throw new NotFoundException('El proyecto no tiene NFT Colibrí asociado');
    }
    if (nftProject.currentHolderUserId !== null) {
      throw new ConflictException('Este proyecto ya tiene un mecenas patrocinador');
    }

    // Ejecutar asignación atómica
    await this.mecenasRepository.assignNftToProject(
      portfolio.id,
      nftProject.id,
      projectId,
      mecenasUserId,
    );

    return { message: 'NFT asignado al proyecto correctamente' };
  }
}