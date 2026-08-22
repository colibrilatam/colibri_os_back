import { faker } from '@faker-js/faker';
import type {
  User,
  Project,
  AuthResponse,
  RegisterResponse,
  ErrorResponse,
  PaginatedProjects,
  UserRole,
  ProjectStatus,
  TrajectoryStatus,
} from '../generated';

function randomUuid(): string {
  return faker.string.uuid();
}

function randomDatetime(): string {
  return faker.date.recent({ days: 30 }).toISOString();
}

function randomEnum<T extends readonly string[]>(values: T): T[number] {
  return values[faker.number.int({ min: 0, max: values.length - 1 })];
}

const ROLES: UserRole[] = ['entrepreneur', 'mentor', 'evaluator', 'admin', 'guest'];
const PROJECT_STATUSES: ProjectStatus[] = ['active', 'inactive', 'closed', 'suspended'];
const TRAJECTORY_STATUSES: TrajectoryStatus[] = ['on_track', 'at_risk', 'stalled', 'completed'];

export function mockUser(overrides?: Partial<User>): User {
  return {
    id: randomUuid(),
    email: faker.internet.email(),
    fullName: faker.person.fullName(),
    role: randomEnum(ROLES),
    status: 'active',
    provider: 'local',
    avatar: faker.image.avatar(),
    bio: faker.lorem.sentence(),
    createdAt: randomDatetime(),
    updatedAt: randomDatetime(),
    ...overrides,
  };
}

export function mockProject(overrides?: Partial<Project>): Project {
  return {
    id: randomUuid(),
    ownerUserId: randomUuid(),
    projectName: faker.company.name(),
    projectImageUrl: faker.image.url(),
    status: randomEnum(PROJECT_STATUSES),
    country: faker.location.country(),
    industry: faker.commerce.department(),
    tagline: faker.lorem.sentence(),
    shortDescription: faker.lorem.paragraph(),
    startupLinkedinUrl: faker.internet.url(),
    websiteUrl: faker.internet.url(),
    rlabProfileUrl: faker.internet.url(),
    trajectoryStatus: randomEnum(TRAJECTORY_STATUSES),
    currentTramoId: randomUuid(),
    currentPacId: randomUuid(),
    nftImageUrl: faker.image.url(),
    lastActivityAt: randomDatetime(),
    createdAt: randomDatetime(),
    updatedAt: randomDatetime(),
    ...overrides,
  };
}

export function mockAuthResponse(overrides?: Partial<AuthResponse>): AuthResponse {
  return {
    message: 'Usuario logueado con exito',
    token: faker.string.alphanumeric(128),
    ...overrides,
  };
}

export function mockRegisterResponse(overrides?: Partial<RegisterResponse>): RegisterResponse {
  return {
    message: 'Usuario registrado con exito',
    token: faker.string.alphanumeric(128),
    ...overrides,
  };
}

export function mockErrorResponse(overrides?: Partial<ErrorResponse>): ErrorResponse {
  return {
    statusCode: faker.number.int({ min: 400, max: 599 }),
    message: faker.lorem.sentence(),
    error: 'Bad Request',
    ...overrides,
  };
}

export function mockPaginatedProjects(overrides?: Partial<PaginatedProjects>): PaginatedProjects {
  const count = faker.number.int({ min: 1, max: 10 });
  return {
    data: Array.from({ length: count }, () => mockProject()),
    total: faker.number.int({ min: count, max: 100 }),
    page: 1,
    limit: 10,
    ...overrides,
  };
}
