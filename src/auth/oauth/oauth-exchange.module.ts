import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from '../../users/entities/user.entity';
import { OAuthExchangeCode } from './oauth-exchange-code.entity';
import { OAuthExchangeService } from './oauth-exchange.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User, OAuthExchangeCode])],
  providers: [OAuthExchangeService],
  exports: [OAuthExchangeService],
})
export class OAuthExchangeModule {}