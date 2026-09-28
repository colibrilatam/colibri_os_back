import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';

interface ContractVersionFile {
  version: string;
}

function readContractVersion(): string {
  const versionPath = resolve(
  process.cwd(),
  'packages',
  'contracts',
  'CONTRACT_VERSION.json',
);
  try {
    const raw = readFileSync(versionPath, 'utf-8');
    const parsed = JSON.parse(raw) as ContractVersionFile;
    return parsed.version ?? '1.0.0';
  } catch {
    return '1.0.0';
  }
}

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