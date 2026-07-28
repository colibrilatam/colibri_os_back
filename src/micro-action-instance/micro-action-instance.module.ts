// src/micro-action-instance/micro-action-instance.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MicroActionInstance } from './entities/micro-action-instance.entity';
import { MicroActionInstanceService } from './micro-action-instance.service';
import { MicroActionInstanceController } from './micro-action-instance.controller';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [TypeOrmModule.forFeature([MicroActionInstance]), ProjectsModule],
  controllers: [MicroActionInstanceController],
  providers: [MicroActionInstanceService],
  exports: [MicroActionInstanceService],
})
export class MicroActionInstanceModule {}
