// src/tramos/tramos.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tramo } from './entities/tramo.entity';
import { ProjectTramoHistory } from './entities/project-tramo-history.entity';
import { Project } from '../projects/entities/project.entity';
import { TramosController } from './tramos.controller';
import { TramosService } from './tramos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tramo,
      ProjectTramoHistory,
      Project,           // necesario para leer/actualizar currentTramoId
    ]),
  ],
  controllers: [TramosController],
  providers: [TramosService],
  exports: [TramosService],  // exportado para que ProjectsService pueda llamar initTramoHistory
})
export class TramosModule {}