import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MecenasNftPortfolio, PortfolioRole } from "src/nfts/entities/mecenas-nft-portfolio.entity";
import { NftEventType, NftOwnershipEvent } from "src/nfts/entities/nft-ownership-event.entity";
import { NftProject } from "src/nfts/entities/nft-project.entity";
import { Project } from "src/projects/entities/project.entity";
import { User, UserRole } from "src/users/entities/user.entity";
import { DataSource, IsNull, Not, Repository } from "typeorm";

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
    ) { }

    async updateUserRole(userId: string): Promise<void> {
        await this.userRepo.update({ id: userId }, {role: UserRole.MECENAS_SEMILLA});
    }

    async findEligibleProjects(): Promise<Project[]> {
        return this.projectRepo
            .createQueryBuilder('project')
            .innerJoinAndSelect('project.nftProject', 'nftProject')
            .where('nftProject.current_holder_user_id IS NULL')
            .getMany();
    }

    async getPortfolioSummary(mecenasUserId: string): Promise<{
        total: number;
        assigned: number;
        available: number;
    }> {
        const [total, assigned] = await Promise.all([
            this.portfolioRepo.count({ where: { mecenasUserId } }),
            this.portfolioRepo.count({
                where: { mecenasUserId, targetProjectId: Not(IsNull()) },
            }),
        ]);

        return { total, assigned, available: total - assigned };
    }

    async assignNftToProject(
        portfolioId: string,
        nftProjectId: string,
        projectId: string,
        mecenasUserId: string,
    ): Promise<void> {
        await this.dataSource.transaction(async (manager) => {
            await manager.update(MecenasNftPortfolio, portfolioId, {
                targetProjectId: projectId,
                acquiredAt: new Date(),
                portfolioRole: PortfolioRole.SEED_ALLY,
            });

            await manager.update(NftProject, nftProjectId, {
                currentHolderUserId: mecenasUserId,
            });

            const event = new NftOwnershipEvent();
            event.nftProjectId = nftProjectId;
            event.fromUserId = null;
            event.toUserId = mecenasUserId;
            event.eventType = NftEventType.ASSIGN;
            event.occurredAt = new Date();

            await manager.save(NftOwnershipEvent, event);
        });
    }
}
