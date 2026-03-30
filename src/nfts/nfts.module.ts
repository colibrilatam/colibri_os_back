import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftProject } from './entities/nft-project.entity';
import { NftActor } from './entities/nft-actor.entity';
import { MecenasNftPortfolio } from './entities/mecenas-nft-portfolio.entity';
import { NftOwnershipEvent } from './entities/nft-ownership-event.entity';
import { NftActorRepository } from './nft-actor/nft-actor.repository';
import { NftActorService } from './nft-actor/nft-actor.service';
import { NftActorController } from './nft-actor/nft-actor.controller';
import { UsersModule } from 'src/users/users.module';
import { MecenasNftPortfolioController } from './mecenas-nft-portfolio/mecenas-nft-portfolio.controller';
import { MecenasNftPortfolioService } from './mecenas-nft-portfolio/mecenas-nft-portfolio.service';
import { MecenasNftPortfolioRepository } from './mecenas-nft-portfolio/mecenas-nft-portfolio.repository';
import { NftProjectController } from './nft-project/nfts-project.controller';
import { NftProjectService } from './nft-project/nfts-project.service';
import { NftOwnershipEventController } from './nft-ownership-event/nft-ownership-event.controller';
import { NftOwnershipEventService } from './nft-ownership-event/nft-ownership-event.service';
import { NftOwnershipEventRepository } from './nft-ownership-event/nft-ownership-event.repository';
import { ProjectsModule } from 'src/projects/projects.module';

@Module({
  imports: [ UsersModule, ProjectsModule,
    TypeOrmModule.forFeature([NftProject, NftActor, MecenasNftPortfolio, NftOwnershipEvent]),
  ],
  controllers: [NftProjectController, NftActorController, MecenasNftPortfolioController, NftOwnershipEventController],
  providers: [NftProjectService,NftActorRepository, NftActorService, MecenasNftPortfolioService, MecenasNftPortfolioRepository, NftOwnershipEventService, NftOwnershipEventRepository],
  exports: [NftProjectService, NftActorService, MecenasNftPortfolioService, NftOwnershipEventService],
})
export class NftsModule {}