import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

export interface E2eContext {
  app: INestApplication;
  dataSource: DataSource;
}

/**
 * Levanta la aplicación real (AppModule completo) para los tests e2e,
 * con los mismos pipes/guards/prefijo global que en producción.
 */
export async function createTestApp(): Promise<E2eContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  const dataSource = app.get(DataSource);

  return { app, dataSource };
}

/**
 * Vacía todas las tablas de la app (menos la tabla de control de migraciones)
 * para que cada archivo de test empiece con una base limpia, sin depender
 * del orden de ejecución ni dejar residuos entre corridas.
 */
export async function cleanDatabase(dataSource: DataSource): Promise<void> {
  const tables: { tablename: string }[] = await dataSource.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename NOT IN ('migrations')
  `);

  if (tables.length === 0) return;

  const tableList = tables.map((t) => `"${t.tablename}"`).join(', ');
  await dataSource.query(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);
}

export async function closeTestApp(context: E2eContext): Promise<void> {
  await context.app.close();
}
