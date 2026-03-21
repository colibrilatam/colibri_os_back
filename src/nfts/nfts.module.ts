import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftProject } from './entities/nft-project.entity';
import { NftActor } from './entities/nft-actor.entity';
import { MecenasNftPortfolio } from './entities/mecenas-nft-portfolio.entity';
import { NftOwnershipEvent } from './entities/nft-ownership-event.entity';
import { NftProjectController } from './nfts-project.controller';
import { NftProjectService } from './nfts-project.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([NftProject, NftActor, MecenasNftPortfolio, NftOwnershipEvent]),
  ],
  controllers: [NftProjectController],
  providers: [NftProjectService],
  exports: [NftProjectService],
})
export class NftsModule {}