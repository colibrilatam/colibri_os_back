// src/evaluation/evaluation.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evaluation } from './entities/evaluation.entity';
import { EvaluationAiResult } from './entities/evaluation-ai-result.entity';
import { EvaluationHumanReview } from './entities/evaluation-human-review.entity';
import { Rubric } from './entities/rubric.entity';
import { EvaluationService } from './evaluation.service';
import { EvaluationController } from './evaluation.controller';
import { EvidenceModule } from '../evidence/evidence.module';
import { Evidence } from '../evidence/entities/evidence.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Evaluation,
      EvaluationAiResult,
      EvaluationHumanReview,
      Rubric,
      Evidence,
    ]),
    EvidenceModule,
  ],
  controllers: [EvaluationController],
  providers: [EvaluationService],
  exports: [EvaluationService],
})
export class EvaluationModule {}