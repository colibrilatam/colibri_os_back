import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectMember } from './entities/project-member.entity';
import { ProjectsModule } from '../projects/projects.module';
import { ProjectMemberController } from './project-members.controller';
import { ProjectMemberService } from './project-members.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectMember]), ProjectsModule],
  controllers: [ProjectMemberController],
  providers: [ProjectMemberService],
  exports: [ProjectMemberService],
})
export class ProjectMembersModule {}