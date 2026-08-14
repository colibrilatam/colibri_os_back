// test/nft-chain-verification.e2e-spec.ts
//
// CHAIN-001 — El historial interno de eventos NFT no debe aceptar hashes,
// actores, fechas ni operaciones sin prueba on-chain.
//
// Estos tests levantan la app real (AppModule) y sólo reemplazan
// BlockchainRpcService por un mock controlable, para poder simular
// respuestas de un nodo RPC real (tx inexistente, otra red, contrato
// distinto, revert, tokenId distinto, pending -> confirmed) sin depender
// de una blockchain real.

import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AppModule } from '../src/app.module';
import { Fixtures } from './fixtures';
import { cleanDatabase } from './e2e-setup';
import { UserRole } from 'src/users/entities/user.entity';
import {
  NftEventType,
  NftChainProofStatus,
} from 'src/nfts/entities/nft-ownership-event.entity';
import { BlockchainRpcService } from 'src/nfts/blockchain-rpc.service';

// Mismo topic que usa NftChainVerificationService para detectar
// eventos ERC-721 Transfer(address,address,uint256).
const ERC721_TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a9df523b3ef';

const CHAIN_ID = 1;
const CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890';
const OTHER_CONTRACT_ADDRESS = '0x' + '9'.repeat(40);
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const FROM_ADDR = '0x' + '1'.repeat(40);
const TO_ADDR = '0x' + '2'.repeat(40);
const REQUIRED_CONFIRMATIONS = 12;

let hashCounter = 0;
function mkTxHash(): string {
  hashCounter += 1;
  return '0x' + hashCounter.toString(16).padStart(64, '0');
}

function padAddress(address: string): string {
  return '0x' + '0'.repeat(24) + address.slice(2).toLowerCase();
}

function padTokenId(tokenId: string | number): string {
  return '0x' + BigInt(tokenId).toString(16).padStart(64, '0');
}

function toHex(n: number): string {
  return '0x' + n.toString(16);
}

/**
 * Doble de prueba de BlockchainRpcService: implementa la misma interfaz
 * pública que usa NftChainVerificationService, pero devuelve datos
 * controlados por cada test en lugar de golpear un RPC real.
 */
class MockBlockchainRpcService {
  getChainId = jest.fn(async (_chainId: number) => CHAIN_ID);
  getTransaction = jest.fn(async (_chainId: number, _hash: string) => null as any);
  getTransactionReceipt = jest.fn(async (_chainId: number, _hash: string) => null as any);
  getBlockByNumber = jest.fn(async (_chainId: number, _blockNumber: string) => null as any);
  getLatestBlockNumber = jest.fn(async (_chainId: number) => 0);
  getRequiredConfirmations = jest.fn((_chainId: number) => REQUIRED_CONFIRMATIONS);

  reset() {
    this.getChainId.mockReset().mockResolvedValue(CHAIN_ID);
    this.getTransaction.mockReset().mockResolvedValue(null as any);
    this.getTransactionReceipt.mockReset().mockResolvedValue(null as any);
    this.getBlockByNumber.mockReset().mockResolvedValue(null as any);
    this.getLatestBlockNumber.mockReset().mockResolvedValue(0);
    this.getRequiredConfirmations
      .mockReset()
      .mockReturnValue(REQUIRED_CONFIRMATIONS);
  }
}

describe('CHAIN-001 — Verificación on-chain de eventos NFT (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let fixtures: Fixtures;
  let rpc: MockBlockchainRpcService;
  const server = () => app.getHttpServer();

  beforeAll(async () => {
    rpc = new MockBlockchainRpcService();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(BlockchainRpcService)
      .useValue(rpc)
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
    fixtures = new Fixtures(app);
  });

  beforeEach(() => {
    rpc.reset();
  });

  afterEach(async () => {
    await cleanDatabase(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  async function setupProject() {
    const admin = await fixtures.createUser(UserRole.ADMIN);
    const nftProject = await fixtures.createNftProjectFixture({
      chainId: CHAIN_ID,
      contractAddress: CONTRACT_ADDRESS,
      // Debe ser numérico: NftChainVerificationService hace
      // BigInt(tokenId) para comparar contra los logs on-chain.
      tokenId: '42',
    } as any);
    return { admin, nftProject };
  }

  /** Arma un mint válido y confirmado (o con overrides puntuales) en el RPC mockeado. */
  function mockValidMintChain(
    txHash: string,
    tokenId: string,
    opts: { confirmations?: number; status?: string } = {},
  ) {
    const blockNumber = 1_000;
    const confirmations = opts.confirmations ?? REQUIRED_CONFIRMATIONS;
    const latest = blockNumber + confirmations - 1;
    const blockHash = '0x' + 'ab'.repeat(32);

    rpc.getTransaction.mockResolvedValueOnce({
      hash: txHash,
      from: ZERO_ADDRESS,
      to: CONTRACT_ADDRESS,
      blockHash,
      blockNumber: toHex(blockNumber),
      transactionIndex: '0x0',
    });

    rpc.getTransactionReceipt.mockResolvedValueOnce({
      transactionHash: txHash,
      transactionIndex: '0x0',
      blockHash,
      blockNumber: toHex(blockNumber),
      from: ZERO_ADDRESS,
      to: CONTRACT_ADDRESS,
      status: opts.status ?? '0x1',
      logs: [
        {
          address: CONTRACT_ADDRESS,
          topics: [
            ERC721_TRANSFER_TOPIC,
            padAddress(ZERO_ADDRESS),
            padAddress(TO_ADDR),
            padTokenId(tokenId),
          ],
          data: '0x',
          blockNumber: toHex(blockNumber),
          transactionHash: txHash,
          transactionIndex: '0x0',
          blockHash,
          logIndex: '0x0',
        },
      ],
    });

    rpc.getBlockByNumber.mockResolvedValueOnce({
      number: toHex(blockNumber),
      hash: blockHash,
      timestamp: toHex(Math.floor(Date.now() / 1000)),
    });

    rpc.getLatestBlockNumber.mockResolvedValueOnce(latest);
  }

  describe('Reconstrucción de eventos confirmados desde blockchain', () => {
    it('201 y chainStatus "confirmed" cuando la tx tiene logs válidos y confirmaciones suficientes', async () => {
      const { admin, nftProject } = await setupProject();
      const txHash = mkTxHash();
      mockValidMintChain(txHash, nftProject.tokenId);

      const res = await request(server())
        .post('/api/v1/nft-ownership-events')
        .set(fixtures.authHeader(admin))
        .send({
          nftProjectId: nftProject.id,
          eventType: NftEventType.MINT,
          txHash,
        })
        .expect(201);

      expect(res.body.chainStatus).toBe(NftChainProofStatus.CONFIRMED);
      expect(res.body.chainId).toBe(CHAIN_ID);
      expect(res.body.contractAddress).toBe(CONTRACT_ADDRESS);
      expect(res.body.tokenId).toBe(nftProject.tokenId);
      expect(res.body.toAddress).toBe(TO_ADDR.toLowerCase());
      expect(res.body.blockNumber).toBeTruthy();
      expect(res.body.confirmations).toBeGreaterThanOrEqual(
        REQUIRED_CONFIRMATIONS,
      );
    });

    it('estado "pending" cuando la tx existe pero todavía no tiene receipt', async () => {
      const { admin, nftProject } = await setupProject();
      const txHash = mkTxHash();

      rpc.getTransaction.mockResolvedValueOnce({
        hash: txHash,
        from: ZERO_ADDRESS,
        to: CONTRACT_ADDRESS,
        blockHash: null,
        blockNumber: null,
        transactionIndex: null,
      });
      rpc.getTransactionReceipt.mockResolvedValueOnce(null);

      const res = await request(server())
        .post('/api/v1/nft-ownership-events')
        .set(fixtures.authHeader(admin))
        .send({
          nftProjectId: nftProject.id,
          eventType: NftEventType.MINT,
          txHash,
        })
        .expect(201);

      expect(res.body.chainStatus).toBe(NftChainProofStatus.PENDING);
    });
  });

  describe('Pruebas negativas', () => {
    it('rechaza (400) un hash inexistente en la red configurada', async () => {
      const { admin, nftProject } = await setupProject();
      const txHash = mkTxHash();

      rpc.getTransaction.mockResolvedValueOnce(null);

      const res = await request(server())
        .post('/api/v1/nft-ownership-events')
        .set(fixtures.authHeader(admin))
        .send({
          nftProjectId: nftProject.id,
          eventType: NftEventType.TRANSFER,
          txHash,
        })
        .expect(400);

      expect(res.body.message).toMatch(/no existe/i);
    });

    it('rechaza (400) un hash válido pero de otra red', async () => {
      const { admin, nftProject } = await setupProject();
      const txHash = mkTxHash();

      // El RPC configurado para chainId 1 responde, en realidad, chainId 999.
      rpc.getChainId.mockResolvedValueOnce(999);

      const res = await request(server())
        .post('/api/v1/nft-ownership-events')
        .set(fixtures.authHeader(admin))
        .send({
          nftProjectId: nftProject.id,
          eventType: NftEventType.TRANSFER,
          txHash,
        })
        .expect(400);

      expect(res.body.message).toMatch(/chainId/i);
    });

    it('rechaza (400) una tx que apunta a un contrato distinto', async () => {
      const { admin, nftProject } = await setupProject();
      const txHash = mkTxHash();

      rpc.getTransaction.mockResolvedValueOnce({
        hash: txHash,
        from: FROM_ADDR,
        to: OTHER_CONTRACT_ADDRESS,
        blockHash: null,
        blockNumber: null,
        transactionIndex: null,
      });

      const res = await request(server())
        .post('/api/v1/nft-ownership-events')
        .set(fixtures.authHeader(admin))
        .send({
          nftProjectId: nftProject.id,
          eventType: NftEventType.TRANSFER,
          txHash,
        })
        .expect(400);

      expect(res.body.message).toMatch(/contrato/i);
    });

    it('rechaza (409) una transacción revertida on-chain', async () => {
      const { admin, nftProject } = await setupProject();
      const txHash = mkTxHash();
      mockValidMintChain(txHash, nftProject.tokenId, { status: '0x0' });

      const res = await request(server())
        .post('/api/v1/nft-ownership-events')
        .set(fixtures.authHeader(admin))
        .send({
          nftProjectId: nftProject.id,
          eventType: NftEventType.MINT,
          txHash,
        })
        .expect(409);

      expect(res.body.message).toMatch(/reverti/i);
    });

    it('rechaza (400) cuando el tokenId del log no coincide con el tokenId esperado', async () => {
      const { admin, nftProject } = await setupProject();
      const txHash = mkTxHash();
      // El proyecto espera tokenId "42", pero el log on-chain trae otro.
      mockValidMintChain(txHash, '999999999');

      const res = await request(server())
        .post('/api/v1/nft-ownership-events')
        .set(fixtures.authHeader(admin))
        .send({
          nftProjectId: nftProject.id,
          eventType: NftEventType.MINT,
          txHash,
        })
        .expect(400);

      expect(res.body.message).toMatch(/tokenId/i);
    });
  });

  describe('Reconciliación periódica', () => {
    it('la reconciliación manual actualiza un evento de "pending" a "confirmed"', async () => {
      const { admin, nftProject } = await setupProject();
      const txHash = mkTxHash();

      // 1) se crea en estado pending (existe la tx pero no hay receipt aún)
      rpc.getTransaction.mockResolvedValueOnce({
        hash: txHash,
        from: ZERO_ADDRESS,
        to: CONTRACT_ADDRESS,
        blockHash: null,
        blockNumber: null,
        transactionIndex: null,
      });
      rpc.getTransactionReceipt.mockResolvedValueOnce(null);

      const created = await request(server())
        .post('/api/v1/nft-ownership-events')
        .set(fixtures.authHeader(admin))
        .send({
          nftProjectId: nftProject.id,
          eventType: NftEventType.MINT,
          txHash,
        })
        .expect(201);

      expect(created.body.chainStatus).toBe(NftChainProofStatus.PENDING);

      // 2) el nodo ya minó el bloque y el receipt está confirmado
      mockValidMintChain(txHash, nftProject.tokenId);

      const reconciled = await request(server())
        .post(`/api/v1/nft-ownership-events/${created.body.id}/reconcile`)
        .set(fixtures.authHeader(admin))
        .expect(201);

      expect(reconciled.body.chainStatus).toBe(NftChainProofStatus.CONFIRMED);
      expect(reconciled.body.lastReconciledAt).toBeTruthy();
    });
  });
});