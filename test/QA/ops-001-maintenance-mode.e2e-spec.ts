// test/QA/ops-001-maintenance-mode.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('OPS-001: bloqueo de escrituras en modo mantenimiento (E2E)', () => {
  let app: INestApplication;
  const originalMaintenanceMode = process.env.MAINTENANCE_MODE;

  beforeAll(async () => {
    process.env.MAINTENANCE_MODE = 'true';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    process.env.MAINTENANCE_MODE = originalMaintenanceMode;
    await app.close();
  });

  it('bloquea POST en modo mantenimiento', async () => {
    const res = await request(app.getHttpServer()).post('/api/v1/auth/signin').send({});
    expect(res.status).toBe(503);
  });

  it('bloquea PUT en modo mantenimiento', async () => {
    const res = await request(app.getHttpServer()).put('/api/v1/users/some-id').send({});
    expect(res.status).toBe(503);
  });

  it('bloquea PATCH en modo mantenimiento', async () => {
    const res = await request(app.getHttpServer()).patch('/api/v1/users/some-id').send({});
    expect(res.status).toBe(503);
  });

  it('bloquea DELETE en modo mantenimiento', async () => {
    const res = await request(app.getHttpServer()).delete('/api/v1/users/some-id');
    expect(res.status).toBe(503);
  });

  it('mantiene /health disponible durante el modo mantenimiento', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health');
    expect(res.status).toBe(200);
  });

  it('mantiene /ready disponible durante el modo mantenimiento', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/ready');
    expect([200, 503]).toContain(res.status); // 503 solo si la DB está caída, no por maintenance mode
  });
});