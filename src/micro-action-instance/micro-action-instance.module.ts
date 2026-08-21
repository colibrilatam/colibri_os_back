// src/micro-action-instance/micro-action-instance.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MicroActionInstance } from './entities/micro-action-instance.entity';
import { MicroActionInstanceVersion } from './entities/micro-action-instance-version.entity';
import { MicroActionDefinition } from '../micro-action-definitions/entities/micro-action-definition.entity';
import { ProjectPac } from '../projects/entities/project.pac.entity';
import { Pac } from '../pacs/entities/pac.entity';
import { MicroActionInstanceService } from './micro-action-instance.service';
import { MicroActionInstanceController } from './micro-action-instance.controller';
import { ProjectsModule } from '../projects/projects.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MicroActionInstance,
      MicroActionInstanceVersion,
      MicroActionDefinition,
      ProjectPac,
      Pac,
    ]),
    ProjectsModule,
    CloudinaryModule,
  ],
  controllers: [MicroActionInstanceController],
  providers: [MicroActionInstanceService],
  exports: [MicroActionInstanceService],
})
export class MicroActionInstanceModule {}