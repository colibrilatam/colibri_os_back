import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { readContractVersion } from '../common/utils/contract-version';

export function buildSwaggerConfig(): Omit<OpenAPIObject, 'paths'> {
  return new DocumentBuilder()
    .setTitle('Colibrí OS API')
    .setDescription('API del sistema Colibrí OS — RaaS (Reputación como Servicio)')
    .setVersion(readContractVersion())
    .addBearerAuth(undefined, 'bearerAuth')
    .build();
}

export const CONTRACT_MODULES = [AuthModule, ProjectsModule, UsersModule];

export function buildContractSwaggerDocument(app: INestApplication): OpenAPIObject {
  return SwaggerModule.createDocument(app, buildSwaggerConfig(), {
    include: CONTRACT_MODULES,
  });
}
