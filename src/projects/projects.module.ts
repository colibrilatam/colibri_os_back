import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { TramosModule } from '../tramos/tramos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project]),
    TramosModule,   // expone TramosService para inyectarlo en ProjectsService
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}