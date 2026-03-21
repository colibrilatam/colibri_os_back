import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectProfile } from './entities/project-profile.entity';
import { ProjectsModule } from '../projects/projects.module';
import { ProjectProfileController } from './project-profile.controller';
import { ProjectProfileService } from './project-profile.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectProfile]), ProjectsModule],
  controllers: [ProjectProfileController],
  providers: [ProjectProfileService],
  exports: [ProjectProfileService],
})
export class ProjectProfileModule {}