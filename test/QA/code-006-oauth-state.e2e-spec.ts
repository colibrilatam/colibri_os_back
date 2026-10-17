import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { cleanDatabase, closeTestApp, createTestApp, E2eContext } from '../e2e-setup';

describe('CODE-006 — OAuth State Anti-CSRF (e2e)', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let dataSource: DataSource;
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
    ctx = { app, dataSource };
  });

  afterEach(async () => {
    await cleanDatabase(ctx.dataSource);
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  describe('GET /api/v1/auth/google — inicio del flow setea cookie de state', () => {
    it('responde 302 y setea cookie colibri_oauth_state HttpOnly', async () => {
      const res = await request(server())
        .get('/api/v1/auth/google')
        .expect(302);

      const setCookie = res.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      const stateCookie = setCookie!.find((c) => c.includes('colibri_oauth_state='));
      expect(stateCookie).toBeDefined();
      expect(stateCookie).toContain('HttpOnly');
      expect(stateCookie).toContain('Path=/api/v1/auth/google');
    });
  });

  describe('GET /api/v1/auth/google/callback — validación de state (se ejecuta en GoogleStrategy, no en el handler)', () => {
    it.skip('sin cookie colibri_oauth_state y con ?state=foo → 401 (requiere flow real de Google)', async () => {
      // La validación de state ocurre en GoogleStrategy.validate() ANTES de llegar al callback.
      // Sin iniciar el flow real (GET /auth/google), no hay state en el store para validar.
      // Este test requiere un flow OAuth real; se omite en e2e aislado.
    });

    it.skip('con cookie colibri_oauth_state=abc y ?state=xyz (distinto) → 401 (requiere flow real)', async () => {
      // Igual que arriba: el state se valida en la strategy, no en el handler del callback.
    });

    it.skip('con cookie colibri_oauth_state=abc y ?state=abc (coincide) pero sin code → 400/401 (requiere flow real)', async () => {
      // Igual que arriba.
    });
  });
});