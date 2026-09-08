import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('OPS-003: rechazo de payload excesivo', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.MAX_JSON_BODY_SIZE = '10kb'; // límite bajo para forzar el test sin generar MBs

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

  it('responde 413 cuando el body excede el límite configurado', async () => {
    const oversizedPayload = { padding: 'x'.repeat(50_000) }; // ~50KB > 10KB

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send(oversizedPayload);

    expect(res.status).toBe(413);
  });
});