import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../projects/entities/project.entity';
import { ProjectMember } from '../project-members/entities/project-member.entity';
import { Evaluation } from '../evaluation/entities/evaluation.entity';
import { AuthorizationAuditModule } from '../authorization-audit/authorization-audit.module';
import { AuthorizationService } from './authorization.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectMember, Evaluation]),
    AuthorizationAuditModule,
  ],
  providers: [AuthorizationService],
  exports: [AuthorizationService],
})
export class AuthorizationModule {}
