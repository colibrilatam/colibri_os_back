import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletAuthController } from './wallet-auth.controller';
import { WalletAuthService } from './wallet-auth.service';
import { WalletNonce } from './entities/wallet-nonce.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { SessionsModule } from '../auth/sessions/sessions.module';

@Module({
  imports: [TypeOrmModule.forFeature([WalletNonce]), UsersModule, AuthModule, SessionsModule],
  controllers: [WalletAuthController],
  providers: [WalletAuthService],
})
export class WalletAuthModule {}
