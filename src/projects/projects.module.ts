import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { TramosModule } from '../tramos/tramos.module';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { Pac } from 'src/pacs/entities/pac.entity';
import { ProjectPac } from './entities/project.pac.entity';

@Module({
  imports: [ CloudinaryModule,
    TypeOrmModule.forFeature([Project, Pac, ProjectPac]),
    TramosModule,   // expone TramosService para inyectarlo en ProjectsService
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}