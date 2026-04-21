// src/reputation/reputation.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IcAlgorithmVersion } from './entities/ic-algorithm-version.entity';
import { ReputationIndexSnapshot } from './entities/reputation-index-snapshot.entity';
import { ReputationIndexExplanation } from './entities/reputation-index-explanation.entity';
import { Evidence } from '../evidence/entities/evidence.entity';
import { MicroActionInstance } from '../micro-action-instance/entities/micro-action-instance.entity';
import { Project } from '../projects/entities/project.entity';
import { ReputationService } from './reputation.service';
import { ReputationController } from './reputation.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      IcAlgorithmVersion,
      ReputationIndexSnapshot,
      ReputationIndexExplanation,
      Evidence,
      MicroActionInstance,
      Project,
    ]),
  ],
  controllers: [ReputationController],
  providers: [ReputationService],
  exports: [ReputationService],
})
export class ReputationModule {}