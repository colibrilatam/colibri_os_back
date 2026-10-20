import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Wallet } from 'ethers';
import { AppModule } from 'src/app.module';

describe('WEB3-002 — throttle del endpoint de nonce', () => {
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

  it('bloquea con 429 al superar el límite de emisión de nonces', async () => {
    let lastStatus = 0;

    for (let i = 0; i < 21; i++) {
      const wallet = Wallet.createRandom();
      const res = await request(app.getHttpServer())
        .post('/api/v1/wallet-auth/nonce')
        .send({ walletAddress: wallet.address, chainId: 1 });
      lastStatus = res.status;
    }

    expect(lastStatus).toBe(429);
  });
});
