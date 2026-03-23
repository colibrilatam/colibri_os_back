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

@Module({
  imports: [ UsersModule,
    TypeOrmModule.forFeature([NftProject, NftActor, MecenasNftPortfolio, NftOwnershipEvent]),
  ],
  controllers: [NftProjectController, NftActorController],
  providers: [NftProjectService,NftActorRepository, NftActorService],
  exports: [NftProjectService, NftActorService],
})
export class NftsModule {}