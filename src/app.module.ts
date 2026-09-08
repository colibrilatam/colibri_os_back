import { Module, MiddlewareConsumer, NestModule} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsModule } from './projects/projects.module';
import { ProjectProfileModule } from './project-profile/project-profile.module';
import { ProjectMembersModule } from './project-members/project-members.module';
import { NftsModule } from './nfts/nfts.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LearningResourceModule } from './learning-resource/learning-resource.module';
import { TramosModule } from './tramos/tramos.module';
import { CategoriesModule } from './categories/categories.module';
import { PacsModule } from './pacs/pacs.module';
import { MicroActionDefinitionsModule } from './micro-action-definitions/micro-action-definitions.module';
import { MicroActionInstanceModule } from './micro-action-instance/micro-action-instance.module';
import { EvidenceModule } from './evidence/evidence.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { cloudinaryConfig } from './cloudinary/cloudinary.config';
import { HierarchyModule } from './hierarchy/hierarchy.module';
import { MecenasSemillaModule } from './mecenas-semilla/mecenas-semilla.module';
import { DigitalCredentialsModule } from './digital-credentials/digital-credentials.module';
import { TramoClosureModule } from './tramo-closure/tramo-closure.module';
import { HealthModule } from './health/health.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { MaintenanceModeMiddleware } from './common/middleware/maintenance-mode.middleware';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [cloudinaryConfig],
      validate: validateEnv,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: false,
        autoLoadEntities: true,
        extra: { family: 4 },
        //dropSchema: true,
      }),
    }),

    // QA-002: rate limiting global. 100 req / 60s por IP como default general;
    // los endpoints sensibles (signin/signup) tienen su propio límite más
    // estricto vía @Throttle en el controller correspondiente.
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),

    AuthModule,
    UsersModule,
    ProjectsModule,
    ProjectProfileModule,
    ProjectMembersModule,
    NftsModule,
    LearningResourceModule,
    TramosModule,
    CategoriesModule,
    PacsModule,
    MicroActionDefinitionsModule,
    MicroActionInstanceModule,
    EvidenceModule,
    CloudinaryModule,
    EvaluationModule,
    HierarchyModule,
    MecenasSemillaModule,
    DigitalCredentialsModule,
    TramoClosureModule,
    HealthModule,
  ],
  providers: [
    // QA-002: aplica el throttling a nivel global, a todos los controllers.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(MaintenanceModeMiddleware).forRoutes('*');
  }
}