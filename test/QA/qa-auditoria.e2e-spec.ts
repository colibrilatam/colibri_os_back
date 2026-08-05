import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { AuthProvider, User, UserRole } from '../../src/users/entities/user.entity';
import { Fixtures } from '../fixtures';
import { cleanDatabase, closeTestApp, E2eContext } from '../e2e-setup';

const QA_PRIMARY_ORIGIN = 'https://app.colibri.example/';
const QA_EXTRA_ORIGINS = ' https://preview.vercel.app, https://staging.colibri.example ';

function parseAllowedOrigins(primary: string | undefined, extra: string | undefined): string[] {
  if (!primary) {
    throw new Error('FRONTEND_URL is required');
  }

  const raw = [primary, ...(extra ? extra.split(',') : [])];

  return raw
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0)
    .map((origin) => {
      try {
        return new URL(origin).origin;
      } catch {
        throw new Error(`Invalid origin: ${origin}`);
      }
    });
}

async function createQaApp(): Promise<E2eContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app: INestApplication = moduleFixture.createNestApplication();
  const allowedOrigins = parseAllowedOrigins(QA_PRIMARY_ORIGIN, QA_EXTRA_ORIGINS);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origen no autorizado por CORS'));
    },
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  return { app, dataSource: app.get(DataSource) };
}

describe('QA audit battery - disponibilidad, CORS y auth', () => {
  let ctx: E2eContext;
  let fixtures: Fixtures;

  const server = () => ctx.app.getHttpServer();

  beforeAll(async () => {
    ctx = await createQaApp();
    fixtures = new Fixtures(ctx.app);
  });

  afterEach(async () => {
    await cleanDatabase(ctx.dataSource);
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  describe('H-01 / H-02 - salud y readiness', () => {
    it('GET /api/v1/health responde ok con timestamp y version', async () => {
      const res = await request(server()).get('/api/v1/health').expect(200);

      expect(res.body.status).toBe('ok');
      expect(res.body.version).toEqual(expect.any(String));
      expect(res.body.timestamp).toEqual(expect.any(String));
      expect(res.body.uptimeSeconds).toEqual(expect.any(Number));
      expect(res.body.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });

    it('GET /api/v1/ready responde ready cuando la base esta disponible', async () => {
      const res = await request(server()).get('/api/v1/ready').expect(200);

      expect(res.body.status).toBe('ready');
      expect(res.body.database).toBe('up');
      expect(res.body.timestamp).toEqual(expect.any(String));
    });

    it('GET /api/v1/ready devuelve 503 si la consulta a la base falla', async () => {
      const querySpy = jest
        .spyOn(ctx.dataSource, 'query')
        .mockRejectedValueOnce(new Error('db down'));

      try {
        await request(server()).get('/api/v1/ready').expect(503);
      } finally {
        querySpy.mockRestore();
      }
    });
  });

  describe('H-03 - CORS', () => {
    it('normaliza la lista de origenes permitidos', () => {
      expect(
        parseAllowedOrigins(
          'https://app.colibri.example/',
          ' https://preview.vercel.app, https://staging.colibri.example ',
        ),
      ).toEqual([
        'https://app.colibri.example',
        'https://preview.vercel.app',
        'https://staging.colibri.example',
      ]);
    });

    it('rechaza un origen mal formado antes de arrancar la app', () => {
      expect(() => parseAllowedOrigins('nota-url', '')).toThrow('Invalid origin: nota-url');
    });

    it('expone headers CORS para un origen permitido', async () => {
      await request(server())
        .get('/api/v1/health')
        .set('Origin', 'https://preview.vercel.app')
        .expect(200)
        .expect('Access-Control-Allow-Origin', 'https://preview.vercel.app')
        .expect('Access-Control-Allow-Credentials', 'true');
    });
  });

  describe('AUTH-001 - registro y acceso local', () => {
    const signupPayload = {
      email: 'Audit.User@Example.com',
      password: 'MiPass@123',
      confirmPassword: 'MiPass@123',
      fullName: 'Audit User',
    };

    it('registra un usuario y guarda el email en minusculas', async () => {
      const res = await request(server())
        .post('/api/v1/auth/signup')
        .send(signupPayload)
        .expect(201);

      expect(res.body.token).toEqual(expect.any(String));

      const storedUser = await ctx.dataSource.getRepository(User).findOneBy({
        email: signupPayload.email.toLowerCase(),
      });

      expect(storedUser).not.toBeNull();
      expect(storedUser?.email).toBe(signupPayload.email.toLowerCase());
    });

    it('permite login y acceso al perfil con el token emitido', async () => {
      await request(server()).post('/api/v1/auth/signup').send(signupPayload).expect(201);

      const loginRes = await request(server())
        .post('/api/v1/auth/signin')
        .send({
          email: signupPayload.email.toLowerCase(),
          password: signupPayload.password,
        })
        .expect(201);

      expect(loginRes.body.token).toEqual(expect.any(String));

      const profileRes = await request(server())
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${loginRes.body.token}`)
        .expect(200);

      expect(profileRes.body.email).toBe(signupPayload.email.toLowerCase());
    });

    it('rechaza un email duplicado aunque cambie el casing', async () => {
      await request(server()).post('/api/v1/auth/signup').send(signupPayload).expect(201);

      await request(server())
        .post('/api/v1/auth/signup')
        .send({
          ...signupPayload,
          email: signupPayload.email.toLowerCase(),
        })
        .expect(400);
    });

    it('rechaza credenciales incorrectas con 401', async () => {
      await request(server()).post('/api/v1/auth/signup').send(signupPayload).expect(201);

      await request(server())
        .post('/api/v1/auth/signin')
        .send({
          email: signupPayload.email.toLowerCase(),
          password: 'WrongPass@123',
        })
        .expect(401);
    });

    it('rechaza el login local cuando la cuenta es de Google', async () => {
      const googleUser = await fixtures.createUser(UserRole.ENTREPRENEUR, {
        email: 'google.audit@example.com',
        provider: AuthProvider.GOOGLE,
        googleId: 'google-123',
        password: null,
        fullName: 'Google Audit',
      });

      const res = await request(server())
        .post('/api/v1/auth/signin')
        .send({
          email: googleUser.email,
          password: 'AnyPass@123',
        })
        .expect(401);

      expect(res.body.message).toContain('Google');
    });
  });
});
