// src/evidence/evidence.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evidence } from './entities/evidence.entity';
import { EvidenceVersion } from './entities/evidence-version.entity';
import { EvidenceService } from './evidence.service';
import { EvidenceController } from './evidence.controller';
import { GoogleDriveModule } from '../google-drive/google-drive.module';
import { MicroActionInstanceModule } from '../micro-action-instance/micro-action-instance.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Evidence, EvidenceVersion]),
    GoogleDriveModule,
    MicroActionInstanceModule,
  ],
  controllers: [EvidenceController],
  providers: [EvidenceService],
  exports: [EvidenceService],
})
export class EvidenceModule {}