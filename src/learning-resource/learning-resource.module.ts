import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningResource } from 'src/curriculum/entities/learning-resource.entity';
import { MicroActionDefinition } from 'src/curriculum/entities/micro-action-definition.entity';
import { Pac } from 'src/curriculum/entities/pac.entity';
import { LearningResourceController } from './learning-resource.controller';
import { LearningResourceRepository } from './learning-resource.repository';
import { LearningResourceService } from './learning-resource.service';


@Module({
  imports: [
    TypeOrmModule.forFeature([LearningResource, Pac, MicroActionDefinition]),
  ],
  controllers: [LearningResourceController],
  providers: [
    LearningResourceRepository,
    LearningResourceService,
  ],
  exports: [LearningResourceService,],
})
export class LearningResourceModule {}