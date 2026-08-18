import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import {
  MecenasNftPortfolio,
  PortfolioRole,
} from 'src/nfts/entities/mecenas-nft-portfolio.entity';

import {
  NftEventType,
  NftOwnershipEvent,
} from 'src/nfts/entities/nft-ownership-event.entity';

import { NftProject } from 'src/nfts/entities/nft-project.entity';
import { Project } from 'src/projects/entities/project.entity';
import {
  User,
  UserRole,
} from 'src/users/entities/user.entity';

import {
  DataSource,
  IsNull,
  Not,
  Repository,
} from 'typeorm';

@Injectable()
export class MecenasSemillaRepository {
  constructor(
    @InjectRepository(MecenasNftPortfolio)
    private readonly portfolioRepo: Repository<MecenasNftPortfolio>,

    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly dataSource: DataSource,
  ) {}

  async updateUserRole(
    userId: string,
  ): Promise<void> {
    await this.userRepo.update(
      { id: userId },
      {
        role: UserRole.MECENAS_SEMILLA,
      },
    );
  }

  async findEligibleProjects(): Promise<Project[]> {
    return this.projectRepo
      .createQueryBuilder('project')
      .innerJoinAndSelect(
        'project.nftProject',
        'nftProject',
      )
      .where(
        'nftProject.current_holder_user_id IS NULL',
      )
      .getMany();
  }

  async getPortfolioSummary(
    mecenasUserId: string,
  ): Promise<{
    total: number;
    assigned: number;
    available: number;
  }> {
    const [total, assigned] = await Promise.all([
      this.portfolioRepo.count({
        where: {
          mecenasUserId,
        },
      }),

      this.portfolioRepo.count({
        where: {
          mecenasUserId,
          targetProjectId: Not(IsNull()),
        },
      }),
    ]);

    return {
      total,
      assigned,
      available: total - assigned,
    };
  }

  async assignNftToProject(
    portfolioId: string,
    nftProjectId: string,
    projectId: string,
    mecenasUserId: string,
  ): Promise<void> {
    await this.dataSource.transaction(
      async (manager) => {
        /*
         * 1. Actualizar el portfolio del mecenas.
         */
        await manager.update(
          MecenasNftPortfolio,
          portfolioId,
          {
            targetProjectId: projectId,
            acquiredAt: new Date(),
            portfolioRole: PortfolioRole.SEED_ALLY,
          },
        );

        /*
         * 2. Actualizar el holder interno del NFT.
         */
        await manager.update(
          NftProject,
          nftProjectId,
          {
            currentHolderUserId: mecenasUserId,
          },
        );

        /*
         * 3. Registrar el evento interno de ownership.
         *
         * IMPORTANTE:
         * Este evento NO contiene evidencia blockchain todavía.
         *
         * El chainStatus queda en PENDING mediante el default
         * definido en NftOwnershipEvent.
         *
         * CHAIN-001 deberá posteriormente validar:
         *
         * - txHash
         * - chainId
         * - contractAddress
         * - tokenId
         * - fromAddress
         * - toAddress
         * - blockNumber
         * - blockHash
         * - confirmations
         * - receipt/status
         */
        const event = new NftOwnershipEvent();

        event.nftProjectId = nftProjectId;
        event.fromUserId = null;
        event.toUserId = mecenasUserId;
        event.eventType = NftEventType.ASSIGN;

        /*
         * La fecha del evento interno representa el momento
         * en que se registró la operación.
         *
         * No debe interpretarse como block.timestamp.
         */
        event.occurredAt = new Date();

        /*
         * No asignamos:
         *
         * event.txHash
         * event.chainId
         * event.contractAddress
         * event.tokenId
         * event.fromAddress
         * event.toAddress
         * event.blockNumber
         * event.blockHash
         *
         * porque todavía no existe una prueba blockchain
         * validada por RPC.
         *
         * chainStatus queda PENDING por default.
         */

        await manager.save(
          NftOwnershipEvent,
          event,
        );
      },
    );
  }
}