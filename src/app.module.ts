import { Module } from '@nestjs/common';
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
import { HierarchyModule } from './hierarchy/hierarchy.module';
import { MicroActionInstanceModule } from './micro-action-instance/micro-action-instance.module';
import { EvidenceModule } from './evidence/evidence.module';
import { GoogleDriveModule } from './google-drive/google-drive.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { googleDriveConfig } from './google-drive/google-drive.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [googleDriveConfig], // ← config de Google Drive
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
        synchronize: true,
        //dropSchema: true,
        logging: false,
        autoLoadEntities: true,
        ssl:
          configService.get<string>('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),
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
    HierarchyModule,
    MicroActionInstanceModule,
    EvidenceModule,
    GoogleDriveModule,
    EvaluationModule,
  ],
})
export class AppModule { }