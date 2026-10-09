import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from 'src/users/entities/user.entity';
import { OAuthExchangeCode } from 'src/auth/oauth/oauth-exchange-code.entity';
import { OAuthExchangeService } from 'src/auth/oauth/oauth-exchange.service';
import { cleanDatabase, closeTestApp, createTestApp, E2eContext } from '../e2e-setup';

describe('CODE-006 — OAuth Callback (e2e)', () => {
  let ctx: E2eContext;
  let app: INestApplication;
  let dataSource: DataSource;
  let userRepo: Repository<User>;
  let exchangeCodeRepo: Repository<OAuthExchangeCode>;
  let oauthExchangeService: OAuthExchangeService;
  const server = () => ctx.app.getHttpServer();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(AuthGuard('google'))
      .useValue({
        canActivate: (ctx: any) => {
          const req = ctx.switchToHttp().getRequest();
          req.user = {
            email: 'code006-new@test.colibri',
            fullName: 'CODE006 Test',
            googleId: 'google-id-code006',
            avatar: 'https://example.com/avatar.png',
            provider: 'google',
          };
          return true;
        },
      })
      .compile();

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
    exchangeCodeRepo = app.get(getRepositoryToken(OAuthExchangeCode));
    oauthExchangeService = app.get(OAuthExchangeService);

    ctx = { app, dataSource };
  });

  afterEach(async () => {
    await cleanDatabase(ctx.dataSource);
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  describe('GET /api/v1/auth/google/callback', () => {
    it('con usuario nuevo → 302, Location contiene SOLO code, sin tempToken/role/jwt/eyJ/access_token/refresh_token', async () => {
      const res = await request(server())
        .get('/api/v1/auth/google/callback')
        .query({ state: 'valid-state' })
        .expect(302);

      const location = res.headers.location;
      expect(location).toBeDefined();

      const url = new URL(location!, `http://localhost`);
      const params = [...url.searchParams.keys()];
      expect(params).toEqual(['code']);
      expect(url.searchParams.get('code')).toBeTruthy();

      const urlString = url.toString();
      expect(urlString).not.toMatch(/tempToken|role|jwt|eyJ|access_token|refresh_token/i);
    });

    it('el callback NO setea cookie colibri_access_token', async () => {
      const res = await request(server())
        .get('/api/v1/auth/google/callback')
        .query({ state: 'valid-state' })
        .expect(302);

      const setCookie = res.headers['set-cookie'];
      if (setCookie) {
        const hasAccessToken = setCookie.some((cookie) =>
          cookie.includes('colibri_access_token='),
        );
        expect(hasAccessToken).toBe(false);
      }
    });

    it('el code emitido es válido: POST /api/v1/auth/google/exchange con ese code responde 200 y devuelve profileCompletionToken para usuario PENDING_PROFILE', async () => {
      const callbackRes = await request(server())
        .get('/api/v1/auth/google/callback')
        .query({ state: 'valid-state' })
        .expect(302);

      const callbackUrl = new URL(callbackRes.headers.location!, `http://localhost`);
      const code = callbackUrl.searchParams.get('code');
      expect(code).toBeTruthy();

      const exchangeRes = await request(server())
        .post('/api/v1/auth/google/exchange')
        .send({ code })
        .expect(200);

      expect(exchangeRes.body.user).toBeDefined();
      expect(exchangeRes.body.requiresProfileCompletion).toBe(true);
      expect(exchangeRes.body.profileCompletionToken).toBeDefined();
      expect(typeof exchangeRes.body.profileCompletionToken).toBe('string');
      expect(exchangeRes.body.profileCompletionToken.split('.').length).toBe(3); // JWT

      const setCookie = exchangeRes.headers['set-cookie'];
      if (setCookie) {
        const hasAccessToken = setCookie.some((cookie) =>
          cookie.includes('colibri_access_token='),
        );
        expect(hasAccessToken).toBe(false);
      }
    });

    it('el code es de un solo uso: primer POST → 200, segundo POST con mismo code → 401', async () => {
      const callbackRes = await request(server())
        .get('/api/v1/auth/google/callback')
        .query({ state: 'valid-state' })
        .expect(302);

      const callbackUrl = new URL(callbackRes.headers.location!, `http://localhost`);
      const code = callbackUrl.searchParams.get('code');
      expect(code).toBeTruthy();

      // Primer uso: éxito (devuelve profileCompletionToken para usuario nuevo PENDING_PROFILE)
      await request(server())
        .post('/api/v1/auth/google/exchange')
        .send({ code })
        .expect(200);

      // Segundo uso: falla porque el código ya fue consumido
      await request(server())
        .post('/api/v1/auth/google/exchange')
        .send({ code })
        .expect(401);
    });
  });
});