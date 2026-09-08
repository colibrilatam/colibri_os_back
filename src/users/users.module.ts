import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserRepository } from './user.repository';
import { UserRoleChangeAudit } from './entities/user-role-change-audit.entity';
import { SessionsModule } from '../auth/sessions/sessions.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserRoleChangeAudit]), SessionsModule],
  controllers: [UsersController],
  providers: [UsersService, UserRepository],
  exports: [UsersService, UserRepository],
})
export class UsersModule {}