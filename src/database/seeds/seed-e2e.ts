import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { AuthProvider, Gender, User, UserRole, UserStatus } from 'src/users/entities/user.entity';
import { Project, ProjectStatus, TrajectoryStatus } from 'src/projects/entities/project.entity';
import { ProjectMember, RoleInTeam } from 'src/project-members/entities/project-member.entity';
import { Tramo } from 'src/tramos/entities/tramo.entity';
import { Category } from 'src/categories/entities/category.entity';
import { Pac } from 'src/pacs/entities/pac.entity';
import {
  EvidenceType,
  MicroActionDefinition,
  MicroActionType,
} from 'src/micro-action-definitions/entities/micro-action-definition.entity';
import {
  MicroActionInstance,
  MicroActionInstanceStatus,
} from 'src/micro-action-instance/entities/micro-action-instance.entity';
import { Evidence, EvidenceStatus } from 'src/evidence/entities/evidence.entity';
import { Evaluation, EvaluationType } from 'src/evaluation/entities/evaluation.entity';
import { Rubric, RubricTargetEntity } from 'src/evaluation/entities/rubric.entity';

/**
 * QA-001: seeder exclusivo del entorno E2E.
 *
 * Crea un dataset deterministico y minimo para la suite Playwright:
 *  - Usuarios por rol con password conocida (admin, entrepreneur A/B,
 *    evaluator asignado a A, mentor, guest, y un usuario dedicado a
 *    pruebas de revocacion de sesion).
 *  - Proyectos A y B (tenants independientes) para pruebas cross-org.
 *  - Jerarquia curricular minima (Tramo -> Category -> Pac -> MAD) + rubrica.
 *  - Microaccion + evidencia en A y B; evaluacion en A (asignada al evaluator)
 *    y en B (creada por el owner, para probar "evaluador no asignado").
 *  - Un usuario Google activo para el flujo OAuth fake (login completo).
 *
 * Reglas de seguridad:
 *  - Solo corre con NODE_ENV=test. Aborta en cualquier otro entorno.
 *  - Trunca TODAS las tablas publicas (menos `migrations`) antes de sembrar,
 *    igual que cleanDatabase de los tests e2e, para ser idempotente.
 *
 * NO usar en dev/staging/produccion. Para el entorno demo/dev existe `seed.ts`.
 */

const E2E_PASSWORD = 'E2e@Passw0rd!';

const E2E_USERS = {
  admin: 'admin@e2e.colibri',
  entrepreneurA: 'entrepreneur-a@e2e.colibri',
  entrepreneurB: 'entrepreneur-b@e2e.colibri',
  evaluator: 'evaluator@e2e.colibri',
  mentor: 'mentor@e2e.colibri',
  guest: 'guest@e2e.colibri',
  revocation: 'revocation@e2e.colibri',
  googleExisting: 'google-existing@colibri.test',
} as const;

function assertTestEnv(): void {
  if (process.env.NODE_ENV !== 'test') {
    console.error(
      `Seed E2E abortado: NODE_ENV="${process.env.NODE_ENV ?? 'undefined'}". ` +
        'Este seeder solo corre con NODE_ENV=test.',
    );
    process.exit(1);
  }
}

async function truncateAll(dataSource: DataSource): Promise<void> {
  const tables: Array<{ tablename: string }> = await dataSource.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename NOT IN ('migrations')
  `);

  if (tables.length === 0) return;

  const list = tables.map((t) => `"${t.tablename}"`).join(', ');
  await dataSource.query(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

async function seedE2e(): Promise<void> {
  assertTestEnv();

  await AppDataSource.initialize();
  console.log('[seed-e2e] Conectado a la DB');

  try {
    await truncateAll(AppDataSource);
    console.log('[seed-e2e] Tablas truncadas');

    const passwordHash = await bcrypt.hash(E2E_PASSWORD, 4);
    const userRepo = AppDataSource.getRepository(User);

    const buildUser = (
      email: string,
      role: UserRole,
      provider: AuthProvider = AuthProvider.LOCAL,
    ): User =>
      userRepo.create({
        email,
        password: passwordHash,
        fullName: `E2E ${role}`,
        role,
        status: UserStatus.ACTIVE,
        provider,
        sessionVersion: 1,
        gender: Gender.PREFER_NOT_TO_SAY,
      });

    const users = await userRepo.save([
      buildUser(E2E_USERS.admin, UserRole.ADMIN),
      buildUser(E2E_USERS.entrepreneurA, UserRole.ENTREPRENEUR),
      buildUser(E2E_USERS.entrepreneurB, UserRole.ENTREPRENEUR),
      buildUser(E2E_USERS.evaluator, UserRole.EVALUATOR),
      buildUser(E2E_USERS.mentor, UserRole.MENTOR),
      buildUser(E2E_USERS.guest, UserRole.GUEST),
      buildUser(E2E_USERS.revocation, UserRole.ENTREPRENEUR),
      buildUser(E2E_USERS.googleExisting, UserRole.ENTREPRENEUR, AuthProvider.GOOGLE),
    ]);

    const byEmail = new Map(users.map((u) => [u.email, u]));
    const admin = byEmail.get(E2E_USERS.admin)!;
    const entrepreneurA = byEmail.get(E2E_USERS.entrepreneurA)!;
    const entrepreneurB = byEmail.get(E2E_USERS.entrepreneurB)!;
    const evaluator = byEmail.get(E2E_USERS.evaluator)!;
    const mentor = byEmail.get(E2E_USERS.mentor)!;
    const revocation = byEmail.get(E2E_USERS.revocation)!;

    // --- Jerarquia curricular minima (catalogo) ---
    const tramo = await AppDataSource.getRepository(Tramo).save(
      AppDataSource.getRepository(Tramo).create({
        code: 'T1',
        name_es: 'Fase Fundacional (E2E)',
        name_en: 'Foundational Phase (E2E)',
        sortOrder: 1,
        isActive: true,
      }),
    );

    const category = await AppDataSource.getRepository(Category).save(
      AppDataSource.getRepository(Category).create({
        tramoId: tramo.id,
        code: 'E2E-CAT-1',
        name_es: 'Categoria E2E',
        name_en: 'E2E Category',
        sortOrder: 1,
        isActive: true,
      }),
    );

    const pac = await AppDataSource.getRepository(Pac).save(
      AppDataSource.getRepository(Pac).create({
        categoryId: category.id,
        code: 'E2E-PAC-1',
        title_es: 'PAC E2E',
        title_en: 'E2E PAC',
        sortOrder: 1,
        isActive: true,
      }),
    );

    const mad = await AppDataSource.getRepository(MicroActionDefinition).save(
      AppDataSource.getRepository(MicroActionDefinition).create({
        pacId: pac.id,
        code: 'E2E-MAD-1',
        instruction_es: 'Microaccion E2E',
        instruction_en: 'E2E micro action',
        sortOrder: 1,
        evidenceRequired: true,
        expectedEvidenceType: EvidenceType.FILE,
        microActionType: MicroActionType.DOCUMENTATION,
      }),
    );

    const rubric = await AppDataSource.getRepository(Rubric).save(
      AppDataSource.getRepository(Rubric).create({
        code: 'E2E-RUBRIC-1',
        name_es: 'Rubrica E2E',
        name_en: 'E2E rubric',
        targetEntity: RubricTargetEntity.EVIDENCE,
        version: 'v1.0',
        isActive: true,
        criteriaJson: { dimensions: [{ name: 'consistency', weight: 1 }] },
      }),
    );

    // --- Proyectos (tenants) ---
    const projectRepo = AppDataSource.getRepository(Project);
    const buildProject = (ownerUserId: string, name: string): Project =>
      projectRepo.create({
        ownerUserId,
        projectName: name,
        status: ProjectStatus.ACTIVE,
        trajectoryStatus: TrajectoryStatus.ON_TRACK,
        country: 'Venezuela',
        industry: 'Edtech',
        currentTramoId: tramo.id,
        currentPacId: pac.id,
        openedAt: new Date(),
        lastActivityAt: new Date(),
      });

    const [projectA, projectB, projectR] = await projectRepo.save([
      buildProject(entrepreneurA.id, 'E2E Project A'),
      buildProject(entrepreneurB.id, 'E2E Project B'),
      buildProject(revocation.id, 'E2E Revocation Project'),
    ]);

    // --- Membresias ---
    const memberRepo = AppDataSource.getRepository(ProjectMember);
    await memberRepo.save([
      memberRepo.create({
        projectId: projectA.id,
        userId: mentor.id,
        roleInTeam: RoleInTeam.ADVISOR,
        isActive: true,
      }),
      memberRepo.create({
        projectId: projectA.id,
        userId: evaluator.id,
        roleInTeam: RoleInTeam.OTHER,
        isActive: true,
      }),
    ]);

    // --- Microacciones instanciadas + evidencias ---
    const instanceRepo = AppDataSource.getRepository(MicroActionInstance);
    const [instanceA, instanceB] = await instanceRepo.save([
      instanceRepo.create({
        projectId: projectA.id,
        actorUserId: entrepreneurA.id,
        microActionDefinitionId: mad.id,
        status: MicroActionInstanceStatus.SUBMITTED,
        executionWindowDaysSnapshot: 7,
      }),
      instanceRepo.create({
        projectId: projectB.id,
        actorUserId: entrepreneurB.id,
        microActionDefinitionId: mad.id,
        status: MicroActionInstanceStatus.SUBMITTED,
        executionWindowDaysSnapshot: 7,
      }),
    ]);

    const evidenceRepo = AppDataSource.getRepository(Evidence);
    const [evidenceA, evidenceB] = await evidenceRepo.save([
      evidenceRepo.create({
        microActionInstanceId: instanceA.id,
        authorUserId: entrepreneurA.id,
        projectId: projectA.id,
        evidenceType: EvidenceType.FILE,
        status: EvidenceStatus.SUBMITTED,
        canonicalUri: 'https://res.cloudinary.com/e2e/raw/upload/v1/e2e/a.pdf',
        description: 'Evidencia E2E de A',
      }),
      evidenceRepo.create({
        microActionInstanceId: instanceB.id,
        authorUserId: entrepreneurB.id,
        projectId: projectB.id,
        evidenceType: EvidenceType.FILE,
        status: EvidenceStatus.SUBMITTED,
        canonicalUri: 'https://res.cloudinary.com/e2e/raw/upload/v1/e2e/b.pdf',
        description: 'Evidencia E2E de B',
      }),
    ]);

    // --- Evaluaciones ---
    // A: creada por el evaluator (asignado). B: creada por el owner B, de modo
    // que el evaluator NO esta asignado en B (caso negativo de autorizacion).
    const evaluationRepo = AppDataSource.getRepository(Evaluation);
    await evaluationRepo.save([
      evaluationRepo.create({
        evidenceId: evidenceA.id,
        rubricId: rubric.id,
        rubricVersion: 'v1.0',
        createdByUserId: evaluator.id,
        evaluationType: EvaluationType.HYBRID,
      }),
      evaluationRepo.create({
        evidenceId: evidenceB.id,
        rubricId: rubric.id,
        rubricVersion: 'v1.0',
        createdByUserId: entrepreneurB.id,
        evaluationType: EvaluationType.HYBRID,
      }),
    ]);

    console.log('[seed-e2e] Dataset E2E creado');
    console.log(`[seed-e2e] Password de usuarios E2E: ${E2E_PASSWORD}`);
    console.log(
      JSON.stringify({
        users: E2E_USERS,
        projects: {
          A: projectA.id,
          B: projectB.id,
          revocation: projectR.id,
        },
        evidence: { A: evidenceA.id, B: evidenceB.id },
        refs: { tramo: tramo.id, rubric: rubric.id, admin: admin.id },
      }),
    );
  } catch (error) {
    console.error('[seed-e2e] Error:', error);
    process.exitCode = 1;
  } finally {
    await AppDataSource.destroy();
  }
}

void seedE2e();
