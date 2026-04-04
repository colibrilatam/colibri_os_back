
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MecenasSemillaController } from './mecenas-semilla.controller';
import { MecenasSemillaService } from './mecenas-semilla.service';
import { MecenasSemillaRepository } from './mecenas-semilla.repository';
import { MecenasNftPortfolio } from '../nfts/entities/mecenas-nft-portfolio.entity';
import { NftProject } from '../nfts/entities/nft-project.entity';
import { NftOwnershipEvent } from '../nfts/entities/nft-ownership-event.entity';
import { Project } from '../projects/entities/project.entity';
import { UsersModule } from '../users/users.module';
import { NftsModule } from '../nfts/nfts.module';
import { ProjectsModule } from '../projects/projects.module';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      MecenasNftPortfolio,
      NftProject,
      NftOwnershipEvent,
      Project,
    ]),
    UsersModule,
    NftsModule,
    ProjectsModule,
  ],
  controllers: [MecenasSemillaController],
  providers: [MecenasSemillaService, MecenasSemillaRepository],
})
export class MecenasSemillaModule {}