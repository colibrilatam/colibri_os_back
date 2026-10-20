import { Inject, Injectable, Module, OnModuleInit, Optional } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './google/google.strategy';
import { GoogleFakeStrategy } from './google/google-fake.strategy';
import { UsersModule } from 'src/users/users.module';
import { SessionsModule } from './sessions/sessions.module';
import { OAuthExchangeModule } from './oauth/oauth-exchange.module';
import { PasswordResetModule } from './password-reset/password-reset.module';
import { JwtAuthGuard } from './guards/auth.guard';

export const GOOGLE_STRATEGY = 'GOOGLE_STRATEGY';

/**
 * QA-001: registra la estrategia passport `google` en tiempo de arranque,
 * eligiendo entre la real y la fake (`E2E_OAUTH_FAKE=true`) segun el entorno.
 *
 * Se instancia siempre para forzar la creacion de la estrategia elegida
 * (passport la registra como efecto de su constructor), sin acoplar los
 * controllers a un tipo concreto.
 */
@Injectable()
class GoogleStrategyRegistrar implements OnModuleInit {
  constructor(@Optional() @Inject(GOOGLE_STRATEGY) private readonly strategy: unknown) {}

  onModuleInit(): void {
    void this.strategy;
  }
}

@Module({
  imports: [
    UsersModule,
    PassportModule,
    SessionsModule,
    OAuthExchangeModule,
    PasswordResetModule,
    JwtModule.registerAsync({
      global: true, // SEC-002: DemoReadOnlyGuard (APP_GUARD) necesita JwtService inyectable.
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          signOptions: {
            expiresIn: configService.get<StringValue>('JWT_EXPIRES_IN'),
          },
          secret: configService.get<string>('JWT_SECRET'),
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    AuthService,
    JwtAuthGuard,
    {
      provide: GOOGLE_STRATEGY,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        if (configService.get<string>('E2E_OAUTH_FAKE') === 'true') {
          return new GoogleFakeStrategy();
        }
        return new GoogleStrategy(configService);
      },
    },
    GoogleStrategyRegistrar,
  ],
  exports: [JwtAuthGuard, AuthService],
})
export class AuthModule {}
