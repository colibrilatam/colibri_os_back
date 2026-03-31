// src/micro-action-definitions/micro-action-definitions.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MicroActionDefinition } from './entities/micro-action-definition.entity';
import { MicroActionDefinitionsService } from './micro-action-definitions.service';
import { MicroActionDefinitionsController } from './micro-action-definitions.controller';
import { PacsModule } from '../pacs/pacs.module';
import { Rubric } from '../evaluation/entities/rubric.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MicroActionDefinition, Rubric]),
    PacsModule,
  ],
  controllers: [MicroActionDefinitionsController],
  providers: [MicroActionDefinitionsService],
  exports: [MicroActionDefinitionsService],
})
export class MicroActionDefinitionsModule {}