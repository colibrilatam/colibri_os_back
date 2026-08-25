import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Response } from 'superagent';
import { AppModule } from '../../src/app.module';

describe('OPS-003: ráfaga sobre compra simulada (mecenas)', () => {
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

  it('bloquea con 429 tras una ráfaga de compras', async () => {
    const fakeUserId = '00000000-0000-4000-8000-000000000000';
    const results: Response[] = [];

    for (let i = 0; i < 6; i++) {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/mecenas-semilla/buy-nfts/${fakeUserId}`)
        .send({ quantity: 1 });
      results.push(res);
    }

    const lastResponse = results[results.length - 1];
    expect(lastResponse.status).toBe(429);
  });
});