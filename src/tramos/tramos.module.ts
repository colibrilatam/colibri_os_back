// src/tramos/tramos.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tramo } from './entities/tramo.entity';
import { TramosService } from './tramos.service';
import { TramosController } from './tramos.controller';
import { Project } from '../projects/entities/project.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tramo, Project])],
  controllers: [TramosController],
  providers: [TramosService],
  exports: [TramosService],
})
export class TramosModule {}