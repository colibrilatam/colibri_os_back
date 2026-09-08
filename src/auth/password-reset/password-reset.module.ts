import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from '../../users/entities/user.entity';
import { PasswordResetToken } from './password-reset-token.entity';
import { PasswordResetService } from './password-reset.service';
import { PasswordResetMailer } from './password-reset-mailer';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, PasswordResetToken]),
    SessionsModule,
  ],
  providers: [PasswordResetService, PasswordResetMailer],
  exports: [PasswordResetService],
})
export class PasswordResetModule {}