#!/usr/bin/env node
/**
 * Prepara una base de datos aislada para correr las suites e2e.
 *
 * Los tests e2e hacen TRUNCATE de todas las tablas, por lo que NUNCA deben
 * apuntar a la DB de desarrollo. Este script:
 *
 *   1. Deriva el nombre de la DB de test (default `colibri_test`) y reutiliza
 *      las credenciales/host de `DATABASE_URL`.
 *   2. Crea la DB si no existe (conectando a la DB de mantenimiento `postgres`).
 *   3. Aplica las migraciones sobre esa DB con `NODE_ENV=test`.
 *
 * Uso:
 *   npm run test:e2e:setup-db
 *   npm run test:e2e
 *
 * Variables opcionales:
 *   TEST_DB_NAME            nombre de la DB de test (default: colibri_test)
 *   TEST_DB_ADMIN_DATABASE  DB de mantenimiento para el CREATE (default: postgres)
 */

import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '..');

// Cargar .env sin pisar variables ya presentes en el entorno.
dotenv.config({ path: resolve(backendRoot, '.env') });

const baseUrl = process.env.DATABASE_URL;
if (!baseUrl) {
  console.error('[setup-test-db] DATABASE_URL no está definida. Configure .env o exporte la variable.');
  process.exit(1);
}

const testDbName = process.env.TEST_DB_NAME || 'colibri_test';
const adminDbName = process.env.TEST_DB_ADMIN_DATABASE || 'postgres';

function withDatabaseName(urlString, dbName) {
  const url = new URL(urlString);
  url.pathname = `/${dbName}`;
  return url.toString();
}

const adminUrl = withDatabaseName(baseUrl, adminDbName);
const testUrl = withDatabaseName(baseUrl, testDbName);

async function ensureDatabase() {
  const pg = (await import('pg')).default;
  const client = new pg.Client({ connectionString: adminUrl });

  await client.connect();
  try {
    const existing = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [testDbName]);
    if (existing.rowCount === 0) {
      // El nombre de la DB no puede parametrizarse en DDL; se cita el identificador.
      await client.query(`CREATE DATABASE "${testDbName.replace(/"/g, '""')}"`);
      console.log(`[setup-test-db] Base de datos creada: ${testDbName}`);
    } else {
      console.log(`[setup-test-db] Base de datos ya existe: ${testDbName}`);
    }
  } finally {
    await client.end();
  }
}

function runMigrations() {
  console.log('[setup-test-db] Aplicando migraciones...');
  execSync('npm run migration:run', {
    cwd: backendRoot,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: testUrl, NODE_ENV: 'test' },
  });
}

await ensureDatabase();
runMigrations();

console.log('\n[setup-test-db] Listo. Ejecutá los e2e con:');
console.log(`  DATABASE_URL=${testUrl} NODE_ENV=test npm run test:e2e`);
