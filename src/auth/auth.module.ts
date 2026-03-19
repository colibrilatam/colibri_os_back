import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import {ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { JwtStrategy } from "./jwt.strategy";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [ PassportModule,
    JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
      return {
        signOptions: {
            expiresIn: configService.get<StringValue>('JWT_EXPIRES_IN')
        },
        secret: configService.get<string>('JWT_SECRET'),
      };
    }
  })],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService],
})
export  class AuthModule {}