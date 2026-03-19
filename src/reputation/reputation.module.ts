import { Module } from '@nestjs/common';
import { ReputationService } from './reputation.service';
import { ReputationController } from './reputation.controller';

@Module({
  controllers: [ReputationController],
  providers: [ReputationService],
})
export class ReputationModule {}
