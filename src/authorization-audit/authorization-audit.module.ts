import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorizationDenialAudit } from './entities/authorization-denial-audit.entity';
import { AuthorizationAuditService } from './authorization-audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuthorizationDenialAudit])],
  providers: [AuthorizationAuditService],
  exports: [AuthorizationAuditService],
})
export class AuthorizationAuditModule {}