// src/evidence/evidence.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Evidence } from './entities/evidence.entity';
import { EvidenceVersion } from './entities/evidence-version.entity';
import { UploadSession } from './entities/upload-session.entity';
import { EvidenceDeletionOutbox } from './entities/evidence-deletion-outbox.entity';
import { EvidenceService } from './evidence.service';
import { EvidenceController } from './evidence.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { MicroActionInstanceModule } from '../micro-action-instance/micro-action-instance.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Evidence, EvidenceVersion, UploadSession, EvidenceDeletionOutbox]),
    ScheduleModule.forRoot(),
    CloudinaryModule,
    MicroActionInstanceModule,
    ProjectsModule,
  ],
  controllers: [EvidenceController],
  providers: [EvidenceService],
  exports: [EvidenceService],
})
export class EvidenceModule {}
