import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftProject } from './entities/nft-project.entity';
import { NftActor } from './entities/nft-actor.entity';
import { MecenasNftPortfolio } from './entities/mecenas-nft-portfolio.entity';
import { NftOwnershipEvent } from './entities/nft-ownership-event.entity';
import { NftProjectController } from './nfts-project.controller';
import { NftProjectService } from './nfts-project.service';
import { NftActorRepository } from './nft-actor/nft-actor.repository';
import { NftActorService } from './nft-actor/nft-actor.service';
import { NftActorController } from './nft-actor/nft-actor.controller';
import { UsersModule } from 'src/users/users.module';
import { MecenasNftPortfolioController } from './mecenas-nft-portfolio/mecenas-nft-portfolio.controller';
import { MecenasNftPortfolioService } from './mecenas-nft-portfolio/mecenas-nft-portfolio.service';
import { MecenasNftPortfolioRepository } from './mecenas-nft-portfolio/mecenas-nft-portfolio.repository';

@Module({
  imports: [ UsersModule,
    TypeOrmModule.forFeature([NftProject, NftActor, MecenasNftPortfolio, NftOwnershipEvent]),
  ],
  controllers: [NftProjectController, NftActorController, MecenasNftPortfolioController],
  providers: [NftProjectService,NftActorRepository, NftActorService, MecenasNftPortfolioService, MecenasNftPortfolioRepository],
  exports: [NftProjectService, NftActorService, MecenasNftPortfolioService],
})
export class NftsModule {}