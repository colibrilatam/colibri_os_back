// src/digital-credentials/digital-credentials.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DigitalCredential } from './entities/digital-credential.entity';
import { DigitalCredentialsService } from './digital-credentials.service';
import { DigitalCredentialsController } from './digital-credentials.controller';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [TypeOrmModule.forFeature([DigitalCredential]), ProjectsModule],
  controllers: [DigitalCredentialsController],
  providers: [DigitalCredentialsService],
  exports: [DigitalCredentialsService],
})
export class DigitalCredentialsModule {}
