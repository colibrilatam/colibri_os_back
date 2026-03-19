import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { NftsModule } from './nfts/nfts.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { ExecutionModule } from './execution/execution.module';
import { ReputationModule } from './reputation/reputation.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: ['dist/migrations/*{.js, .ts}'],
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        logging: configService.get<string>('NODE_ENV') === 'development' && configService.get<string>('DB_LOGGING') === 'true',
        autoLoadEntities: true,
      }),
    }),
    AuthModule,
    UsersModule,
    ProjectsModule,
    NftsModule,
    CurriculumModule,
    EvaluationModule,
    ExecutionModule,
    ReputationModule,
    AnalyticsModule,
  ],
})
export class AppModule {}