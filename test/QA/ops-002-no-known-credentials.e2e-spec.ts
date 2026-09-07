// test/QA/ops-002-no-known-credentials.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('OPS-002: no deben existir cuentas con la credencial conocida', () => {
  let app: INestApplication;

  const knownEmails = [
    'lucas@colibri.com',
    'ana@colibri.com',
    'martin@colibri.com',
    'sofia@colibri.com',
    'mecenas@colibri.com',
    'BancoDV@colibri.com',
    'mentor@colibri.com',
    'evaluator@colibri.com',
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(knownEmails)('login con Test@1234 falla para %s', async (email) => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/signin')
      .send({ email, password: 'Test@1234' });

    expect(res.status).not.toBe(200);
    expect(res.status).not.toBe(201);
  });
});