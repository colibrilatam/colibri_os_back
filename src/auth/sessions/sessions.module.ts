import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from '../../users/entities/user.entity';
import { RefreshToken } from './refresh-token.entity';
import { SessionsService } from './sessions.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User, RefreshToken])],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}