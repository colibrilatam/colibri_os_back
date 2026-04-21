// src/tramo-closure/tramo-closure.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evidence } from '../evidence/entities/evidence.entity';
import { MicroActionInstance } from '../micro-action-instance/entities/micro-action-instance.entity';
import { MicroActionDefinition } from '../micro-action-definitions/entities/micro-action-definition.entity';
import { Pac } from '../pacs/entities/pac.entity';
import { Category } from '../categories/entities/category.entity';
import { Tramo } from '../tramos/entities/tramo.entity';
import { Project } from '../projects/entities/project.entity';
import { TramoClosureService } from './tramo-closure.service';
import { TramoClosureController } from './tramo-closure.controller';
import { ReputationModule } from '../reputation/reputation.module';
import { NftsModule } from '../nfts/nfts.module'; 
import { TramosModule } from '../tramos/tramos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Evidence,
      MicroActionInstance,
      MicroActionDefinition,
      Pac,
      Category,
      Tramo,
      Project,
    ]),
    ReputationModule,
    NftsModule,
    TramosModule,
  ],
  controllers: [TramoClosureController],
  providers: [TramoClosureService],
  exports: [TramoClosureService],
})
export class TramoClosureModule {}