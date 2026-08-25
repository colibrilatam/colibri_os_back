import { randomBytes } from 'crypto';
import { AppDataSource } from '../data-source';
import { seedUsers } from './seeders/Users.seeder';
import { seedProjects } from './seeders/Projects.seeder';
import { seedNfts } from './seeders/Nfts.seeder';
import { seedProjectMembers } from './seeders/Project.members.seeder';
import { seedTramos } from './seeders/Tramos.seeder';
import { seedCategories } from './seeders/Categories.seeder';
import { seedPacs } from './seeders/Pacs.seeder';
import { seedRubrics } from './seeders/Rubrics.seeder';
import { seedMicroActionDefinitions } from './seeders/Micro-action-definitions.seeder';
import { seedLearningResources } from './seeders/Learning-resources.seeder';
import { seedAlgorithmVersions } from './seeders/Algorithm-versions.seeder';
import { seedMicroActionInstances } from './seeders/Micro-action-instances.seeder';
import { seedEvidences } from './seeders/evidence.seeder';
import { seedProjectPacs } from './seeders/ProjectPac.seeder';

/**
 * OPS-002: kill-switch de seeds destructivas.
 *
 * El script hace un TRUNCATE ... CASCADE de prácticamente toda la base y
 * siembra usuarios con contraseña conocida. Esto es aceptable en local/dev,
 * pero es un riesgo grave si se ejecuta por error contra producción.
 *
 * Capas de protección (todas deben cumplirse para que el TRUNCATE corra):
 *   1. Si NODE_ENV=production, el seed se aborta siempre — no hay bandera
 *      que permita sembrar producción. Producción no se siembra, se migra.
 *   2. Independientemente del entorno, la acción destructiva (TRUNCATE CASCADE)
 *      exige una confirmación explícita separada: CONFIRM_DESTRUCTIVE_SEED=yes-destroy-data.
 *      Esto evita truncados accidentales incluso en dev/staging por un
 *      "seed" corrido sin querer contra la DB equivocada.
 *   3. Todo intento (bloqueado o permitido) queda registrado en logSeedAttempt().
 */

const DESTRUCTIVE_CONFIRMATION_VALUE = 'yes-destroy-data';

function logSeedAttempt(event: string, details: Record<string, unknown> = {}): void {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      event,
      nodeEnv: process.env.NODE_ENV ?? 'undefined',
      timestamp: new Date().toISOString(),
      ...details,
    }),
  );
}

function assertSeedIsAllowed(): void {
  if (process.env.NODE_ENV === 'production') {
    logSeedAttempt('seed_blocked_production_env');
    console.error(
      '❌ Seed abortado: NODE_ENV=production. Las seeds nunca corren contra producción. ' +
        'Producción se puebla vía migraciones, no vía este script.',
    );
    process.exit(1);
  }

  if (process.env.CONFIRM_DESTRUCTIVE_SEED !== DESTRUCTIVE_CONFIRMATION_VALUE) {
    logSeedAttempt('seed_blocked_missing_destructive_confirmation');
    console.error(
      '❌ Seed abortado: falta confirmación explícita. Este script ejecuta ' +
        'TRUNCATE ... CASCADE sobre la base de datos actual. Si estás seguro de ' +
        `que es la base correcta, corré con CONFIRM_DESTRUCTIVE_SEED=${DESTRUCTIVE_CONFIRMATION_VALUE}.`,
    );
    process.exit(1);
  }

  logSeedAttempt('seed_allowed', { database: safeDbLabel() });
}

function safeDbLabel(): string {
  // No logueamos la URL completa (puede incluir usuario/password); solo el host+db.
  const url = process.env.DATABASE_URL;
  if (!url) return 'unknown';
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return 'unparseable';
  }
}

/**
 * OPS-002: nunca sembrar con una contraseña fija conocida (ej. "Test@1234").
 * Si no se define SEED_USERS_PASSWORD, se genera una aleatoria por corrida
 * y se imprime una única vez para uso local.
 */
function resolveSeedPassword(): string {
  const fromEnv = process.env.SEED_USERS_PASSWORD;
  if (fromEnv && fromEnv.trim().length >= 8) {
    return fromEnv;
  }

  const generated = randomBytes(9).toString('base64url'); // ~12 caracteres
  console.log(
    `🔐 SEED_USERS_PASSWORD no definida: se generó una contraseña aleatoria para las cuentas de seed: ${generated}`,
  );
  console.log('   (Definí SEED_USERS_PASSWORD en tu .env si querés fijar una vos mismo.)');
  return generated;
}

async function seed() {
  assertSeedIsAllowed();

  const seedPassword = resolveSeedPassword();

  await AppDataSource.initialize();
  console.log('📦 Conectado a la DB');

  try {
    await AppDataSource.query(
      `TRUNCATE TABLE
        "learning_resources",
        "evidence_versions",
        "evidences",
        "micro_action_instances",
        "micro_action_definitions",
        "project_pacs",
        "pacs",
        "categories",
        "tramos",
        "nft_ownership_events",
        "project_members",
        "nft_actors",
        "mecenas_nft_portfolios",
        "nft_projects",
        "projects",
        "users",
        "rubrics",
        "ic_algorithm_versions"
        RESTART IDENTITY CASCADE;
    `,
    );
    logSeedAttempt('seed_truncate_executed', { database: safeDbLabel() });

    const users = await seedUsers(AppDataSource, seedPassword);
    const tramos = await seedTramos(AppDataSource);
    const categories = await seedCategories(AppDataSource, tramos);
    const pacs = await seedPacs(AppDataSource, categories);

    // seedProjects ahora recibe pacs para asignar currentPacId y crear ProjectPacs
    const projects = await seedProjects(AppDataSource, users, tramos, pacs);
    const projectPacs = await seedProjectPacs(AppDataSource, projects, pacs);

    await seedNfts(AppDataSource, users, projects);
    await seedProjectMembers(AppDataSource, users, projects);

    const rubrics = await seedRubrics(AppDataSource);
    const microActionDefs = await seedMicroActionDefinitions(AppDataSource, pacs, rubrics);
    const microActionInstances = await seedMicroActionInstances(
      AppDataSource,
      users,
      projects,
      microActionDefs,
    );

    await seedEvidences(AppDataSource, users, projects, microActionDefs, microActionInstances);

    await seedLearningResources(AppDataSource, pacs, microActionDefs);

    await seedAlgorithmVersions(AppDataSource);

    logSeedAttempt('seed_completed', { database: safeDbLabel() });
    console.log('\n🌱 Seed completado exitosamente');
  } catch (error) {
    logSeedAttempt('seed_failed', { error: error instanceof Error ? error.message : String(error) });
    console.error('❌ Error en seed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();