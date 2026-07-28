import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User, UserRole, UserStatus, AuthProvider } from 'src/users/entities/user.entity';
import { Project, ProjectStatus } from 'src/projects/entities/project.entity';
import { ProjectMember } from 'src/project-members/entities/project-member.entity';
import { Tramo } from 'src/tramos/entities/tramo.entity';
import { Category } from 'src/categories/entities/category.entity';
import { Pac } from 'src/pacs/entities/pac.entity';
import {
  MicroActionDefinition,
  EvidenceType as MadEvidenceType,
} from 'src/micro-action-definitions/entities/micro-action-definition.entity';
import {
  MicroActionInstance,
  MicroActionInstanceStatus,
} from 'src/micro-action-instance/entities/micro-action-instance.entity';
import { Evidence, EvidenceStatus } from 'src/evidence/entities/evidence.entity';
import { Rubric, RubricTargetEntity } from 'src/evaluation/entities/rubric.entity';

let counter = 0;
/** Sufijo corto y único por fixture, para no chocar con `unique: true` entre tests. */
const uniq = (prefix: string) => `${prefix}-${Date.now()}-${counter++}`;

export class Fixtures {
  private readonly userRepo: Repository<User>;
  private readonly projectRepo: Repository<Project>;
  private readonly projectMemberRepo: Repository<ProjectMember>;
  private readonly tramoRepo: Repository<Tramo>;
  private readonly categoryRepo: Repository<Category>;
  private readonly pacRepo: Repository<Pac>;
  private readonly madRepo: Repository<MicroActionDefinition>;
  private readonly instanceRepo: Repository<MicroActionInstance>;
  private readonly evidenceRepo: Repository<Evidence>;
  private readonly rubricRepo: Repository<Rubric>;
  private readonly jwtService: JwtService;

  constructor(private readonly app: INestApplication) {
    this.userRepo = app.get(getRepositoryToken(User));
    this.projectRepo = app.get(getRepositoryToken(Project));
    this.projectMemberRepo = app.get(getRepositoryToken(ProjectMember));
    this.tramoRepo = app.get(getRepositoryToken(Tramo));
    this.categoryRepo = app.get(getRepositoryToken(Category));
    this.pacRepo = app.get(getRepositoryToken(Pac));
    this.madRepo = app.get(getRepositoryToken(MicroActionDefinition));
    this.instanceRepo = app.get(getRepositoryToken(MicroActionInstance));
    this.evidenceRepo = app.get(getRepositoryToken(Evidence));
    this.rubricRepo = app.get(getRepositoryToken(Rubric));
    this.jwtService = app.get(JwtService);
  }

  // ─── Usuarios ───────────────────────────────────────────────────────────────

  async createUser(role: UserRole, overrides: Partial<User> = {}): Promise<User> {
    const email = overrides.email ?? `${uniq(role)}@test.colibri`;
    const passwordHash = await bcrypt.hash('Test@1234', 4); // rondas bajas: los tests no necesitan seguridad, solo velocidad
    const user = this.userRepo.create({
      email,
      password: passwordHash,
      fullName: overrides.fullName ?? `Usuario ${role}`,
      role,
      status: overrides.status ?? UserStatus.ACTIVE,
      provider: AuthProvider.LOCAL,
      ...overrides,
    });
    return this.userRepo.save(user);
  }

  async setUserStatus(userId: string, status: UserStatus): Promise<void> {
    await this.userRepo.update({ id: userId }, { status });
  }

  /** Firma un token real (mismo payload que AuthService.generateToken) para el usuario dado. */
  tokenFor(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    });
  }

  authHeader(user: User): { Authorization: string } {
    return { Authorization: `Bearer ${this.tokenFor(user)}` };
  }

  // ─── Jerarquía curricular mínima (Tramo → Category → Pac → MicroActionDefinition) ──

  async createTramo(overrides: Partial<Tramo> = {}): Promise<Tramo> {
    return this.tramoRepo.save(
      this.tramoRepo.create({
        code: uniq('TRAMO'),
        name_es: 'Tramo de prueba',
        name_en: 'Test tramo',
        sortOrder: 1,
        ...overrides,
      }),
    );
  }

  async createCategory(tramoId: string, overrides: Partial<Category> = {}): Promise<Category> {
    return this.categoryRepo.save(
      this.categoryRepo.create({
        tramoId,
        code: uniq('CAT'),
        name_es: 'Categoría de prueba',
        name_en: 'Test category',
        sortOrder: 1,
        ...overrides,
      } as Category),
    );
  }

  async createPac(categoryId: string, overrides: Partial<Pac> = {}): Promise<Pac> {
    return this.pacRepo.save(
      this.pacRepo.create({
        categoryId,
        code: uniq('PAC'),
        title_es: 'PAC de prueba',
        title_en: 'Test PAC',
        sortOrder: 1,
        ...overrides,
      } as Pac),
    );
  }

  async createMicroActionDefinition(
    pacId: string,
    overrides: Partial<MicroActionDefinition> = {},
  ): Promise<MicroActionDefinition> {
    return this.madRepo.save(
      this.madRepo.create({
        pacId,
        code: uniq('MAD'),
        instruction_es: 'Instrucción de prueba',
        instruction_en: 'Test instruction',
        sortOrder: 1,
        evidenceRequired: true,
        expectedEvidenceType: MadEvidenceType.FILE,
        ...overrides,
      } as MicroActionDefinition),
    );
  }

  /** Crea toda la jerarquía curricular mínima de una sola vez. */
  async createCurriculumChain(): Promise<MicroActionDefinition> {
    const tramo = await this.createTramo();
    const category = await this.createCategory(tramo.id);
    const pac = await this.createPac(category.id);
    return this.createMicroActionDefinition(pac.id);
  }

  // ─── Proyecto y equipo ──────────────────────────────────────────────────────

  async createProject(ownerUserId: string, overrides: Partial<Project> = {}): Promise<Project> {
    return this.projectRepo.save(
      this.projectRepo.create({
        ownerUserId,
        projectName: uniq('Proyecto'),
        status: ProjectStatus.ACTIVE,
        ...overrides,
      } as Project),
    );
  }

  async addProjectMember(
    projectId: string,
    userId: string,
    overrides: Partial<ProjectMember> = {},
  ): Promise<ProjectMember> {
    return this.projectMemberRepo.save(
      this.projectMemberRepo.create({
        projectId,
        userId,
        isActive: true,
        ...overrides,
      } as ProjectMember),
    );
  }

  // ─── Microacción y evidencia ────────────────────────────────────────────────

  async createMicroActionInstance(
    projectId: string,
    actorUserId: string,
    microActionDefinitionId: string,
    overrides: Partial<MicroActionInstance> = {},
  ): Promise<MicroActionInstance> {
    return this.instanceRepo.save(
      this.instanceRepo.create({
        projectId,
        actorUserId,
        microActionDefinitionId,
        status: MicroActionInstanceStatus.IN_PROGRESS,
        ...overrides,
      } as MicroActionInstance),
    );
  }

  async createEvidence(
    overrides: Partial<Evidence> & {
      microActionInstanceId: string;
      authorUserId: string;
      projectId: string;
    },
  ): Promise<Evidence> {
    return this.evidenceRepo.save(
      this.evidenceRepo.create({
        evidenceType: MadEvidenceType.FILE,
        canonicalUri: 'https://res.cloudinary.com/colibri/raw/upload/v1/test/archivo.pdf',
        status: EvidenceStatus.DRAFT,
        ...overrides,
      } as Evidence),
    );
  }

  async createRubric(overrides: Partial<Rubric> = {}): Promise<Rubric> {
    return this.rubricRepo.save(
      this.rubricRepo.create({
        code: uniq('RUB'),
        name_es: 'Rúbrica de prueba',
        name_en: 'Test rubric',
        targetEntity: RubricTargetEntity.EVIDENCE,
        version: 'v1.0',
        isActive: true,
        criteriaJson: { dimensions: [{ name: 'consistency', weight: 1 }] },
        ...overrides,
      } as Rubric),
    );
  }

  /**
   * Arma de punta a punta: 2 tenants (proyectos) independientes, cada uno con
   * su ENTREPRENEUR dueño, y devuelve todo lo necesario para tests de
   * aislamiento multi-tenant (QA-TEST-002).
   */
  async createTwoTenantScenario() {
    const mad = await this.createCurriculumChain();

    const ownerA = await this.createUser(UserRole.ENTREPRENEUR);
    const projectA = await this.createProject(ownerA.id);
    const instanceA = await this.createMicroActionInstance(projectA.id, ownerA.id, mad.id);

    const ownerB = await this.createUser(UserRole.ENTREPRENEUR);
    const projectB = await this.createProject(ownerB.id);
    const instanceB = await this.createMicroActionInstance(projectB.id, ownerB.id, mad.id);

    return { mad, ownerA, projectA, instanceA, ownerB, projectB, instanceB };
  }
}
