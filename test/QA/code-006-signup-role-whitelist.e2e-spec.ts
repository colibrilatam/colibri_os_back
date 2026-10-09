import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from 'src/users/entities/user.entity';
import { cleanDatabase, closeTestApp, createTestApp, E2eContext } from '../e2e-setup';

describe('CODE-006 — Signup Role Whitelist (e2e)', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let dataSource: DataSource;
  let userRepo: Repository<User>;
  const server = () => ctx.app.getHttpServer();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    userRepo = app.get(getRepositoryToken(User));

    ctx = { app, dataSource };
  });

  afterEach(async () => {
    await cleanDatabase(ctx.dataSource);
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  const baseSignup = {
    password: 'Abcdef1!',
    confirmPassword: 'Abcdef1!',
    fullName: 'Test User',
  };

  const uniqueEmail = (suffix: string) => `signup-${suffix}-${Date.now()}@test.colibri`;

  it('POST /api/v1/auth/signup con role: entrepreneur → 201, user.role = entrepreneur', async () => {
    const email = uniqueEmail('entrepreneur');
    const res = await request(server())
      .post('/api/v1/auth/signup')
      .send({ ...baseSignup, email, role: UserRole.ENTREPRENEUR })
      .expect(201);

    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe(UserRole.ENTREPRENEUR);
    expect(res.body.message).toBe('Usuario registrado con éxito');

    const userInDb = await userRepo.findOneBy({ email });
    expect(userInDb).toBeDefined();
    expect(userInDb!.role).toBe(UserRole.ENTREPRENEUR);
  });

  it('POST /api/v1/auth/signup con role: evaluator → 201, user.role = evaluator', async () => {
    const email = uniqueEmail('evaluator');
    const res = await request(server())
      .post('/api/v1/auth/signup')
      .send({ ...baseSignup, email, role: UserRole.EVALUATOR })
      .expect(201);

    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe(UserRole.EVALUATOR);

    const userInDb = await userRepo.findOneBy({ email });
    expect(userInDb).toBeDefined();
    expect(userInDb!.role).toBe(UserRole.EVALUATOR);
  });

  it('POST /api/v1/auth/signup sin role → 201, user.role = entrepreneur (default)', async () => {
    const email = uniqueEmail('default');
    const res = await request(server())
      .post('/api/v1/auth/signup')
      .send({ ...baseSignup, email })
      .expect(201);

    expect(res.body.user).toBeDefined();
    expect(res.body.user.role).toBe(UserRole.ENTREPRENEUR);

    const userInDb = await userRepo.findOneBy({ email });
    expect(userInDb).toBeDefined();
    expect(userInDb!.role).toBe(UserRole.ENTREPRENEUR);
  });

  it('POST /api/v1/auth/signup con role: admin → 400, sin crear usuario', async () => {
    const email = uniqueEmail('admin');
    const res = await request(server())
      .post('/api/v1/auth/signup')
      .send({ ...baseSignup, email, role: UserRole.ADMIN })
      .expect(400);

    expect(res.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining('role debe ser uno de')]),
    );

    const userInDb = await userRepo.findOneBy({ email });
    expect(userInDb).toBeNull();
  });

  it('POST /api/v1/auth/signup con role: mentor → 400, sin crear usuario', async () => {
    const email = uniqueEmail('mentor');
    const res = await request(server())
      .post('/api/v1/auth/signup')
      .send({ ...baseSignup, email, role: UserRole.MENTOR })
      .expect(400);

    expect(res.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining('role debe ser uno de')]),
    );

    const userInDb = await userRepo.findOneBy({ email });
    expect(userInDb).toBeNull();
  });

  it('POST /api/v1/auth/signup con role: mecenas_semilla → 400, sin crear usuario', async () => {
    const email = uniqueEmail('mecenas');
    const res = await request(server())
      .post('/api/v1/auth/signup')
      .send({ ...baseSignup, email, role: UserRole.MECENAS_SEMILLA })
      .expect((res) => {
        // Puede ser 400 (validación) o 429 (throttle)
        expect([400, 429]).toContain(res.status);
      });

    if (res.status === 400) {
      expect(res.body.message).toContain('role debe ser uno de');
    }

    const userInDb = await userRepo.findOneBy({ email });
    expect(userInDb).toBeNull();
  });
});