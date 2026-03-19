import { Module } from '@nestjs/common';
import { ExecutionService } from './execution.service';
import { ExecutionController } from './execution.controller';

@Module({
  controllers: [ExecutionController],
  providers: [ExecutionService],
})
export class ExecutionModule {}
