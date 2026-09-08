import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Response } from 'superagent';
import { AppModule } from '../../src/app.module';

describe('OPS-003: fuerza bruta sobre login', () => {
  let app: INestApplication;

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

  it('bloquea con 429 después de superar el límite de intentos de login', async () => {
    const results: Response[] = [];

    for (let i = 0; i < 6; i++) {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({ email: 'nadie@colibri.com', password: 'incorrecta' });
      results.push(res);
    }

    const lastResponse = results[results.length - 1];
    expect(lastResponse.status).toBe(429);
  });
});