// src/app.module.ts

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
import { MicroActionInstanceModule } from './micro-action-instance/micro-action-instance.module';
import { EvidenceModule } from './evidence/evidence.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { EvaluationModule } from './evaluation/evaluation.module';
import { cloudinaryConfig } from './cloudinary/cloudinary.config';
import { HierarchyModule } from './hierarchy/hierarchy.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [cloudinaryConfig],
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
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        logging: false,
        autoLoadEntities: true,
        //dropSchema: true
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
    MicroActionInstanceModule,
    EvidenceModule,
    CloudinaryModule,
    EvaluationModule,
    HierarchyModule
  ],
})
export class AppModule {}