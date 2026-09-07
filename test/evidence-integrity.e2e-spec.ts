// test/evidence-integrity.e2e-spec.ts

import request from 'supertest';
import * as crypto from 'crypto';
import { createTestApp, cleanDatabase, closeTestApp, E2eContext } from './e2e-setup';
import { Fixtures } from './fixtures';
import { EvidenceVersion } from 'src/evidence/entities/evidence-version.entity';
import { EvidenceStatus } from 'src/evidence/entities/evidence.entity';

describe('Evidence — FILE-002 verificación de integridad SHA-256 sobre contenido (e2e)', () => {
  let ctx: E2eContext;
  let fixtures: Fixtures;
  const server = () => ctx.app.getHttpServer();
  const STORAGE_URI = 'https://res.cloudinary.com/colibri/raw/upload/v1/test/archivo.pdf';

  const sha256 = (content: string) => crypto.createHash('sha256').update(content).digest('hex');

  const mockFetchOnce = (content: string) => {
    return jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      headers: { get: (h: string) => (h === 'content-length' ? String(content.length) : 'application/pdf') },
      arrayBuffer: async () => Buffer.from(content),
    } as unknown as Response);
  };

  beforeAll(async () => {
    ctx = await createTestApp();
    fixtures = new Fixtures(ctx.app);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await cleanDatabase(ctx.dataSource);
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  async function createEvidenceWithVersion(content: string) {
    const { instanceA, ownerA, projectA } = await fixtures.createTwoTenantScenario();
    const evidence = await fixtures.createEvidence({
      microActionInstanceId: instanceA.id,
      authorUserId: ownerA.id,
      projectId: instanceA.projectId,
      status: EvidenceStatus.SUBMITTED,
      canonicalUri: STORAGE_URI,
    });

    const versionRepo = ctx.dataSource.getRepository(EvidenceVersion);
    await versionRepo.save(
      versionRepo.create({
        evidenceId: evidence.id,
        versionNumber: 1,
        storageUri: STORAGE_URI,
        contentHash: sha256(content),
        hashAlgorithm: 'sha256',
        byteSize: Buffer.byteLength(content),
        mimeType: 'application/pdf',
        createdByUserId: ownerA.id,
      } as EvidenceVersion),
    );

    return { evidence, ownerA, projectA };
  }

  it('el hash cambia cuando cambian los bytes (dos contenidos distintos -> distinto hash)', () => {
    expect(sha256('contenido-A')).not.toEqual(sha256('contenido-B'));
  });

  it('200 e isValid=true cuando el contenido descargado coincide con el hash almacenado', async () => {
    const content = 'contenido-original-del-archivo';
    const { evidence, ownerA } = await createEvidenceWithVersion(content);
    mockFetchOnce(content);

    const res = await request(server())
      .get(`/api/v1/evidence/${evidence.id}/verify-integrity`)
      .set(fixtures.authHeader(ownerA));

    expect(res.status).toBe(200);
    expect(res.body.isValid).toBe(true);
    expect(res.body.algorithm).toBe('sha256');
    expect(res.body.expectedHash).toBe(res.body.calculatedHash);
  });

  it('la verificación puede repetirse dando el mismo resultado', async () => {
    const content = 'contenido-estable';
    const { evidence, ownerA } = await createEvidenceWithVersion(content);

    mockFetchOnce(content);
    const first = await request(server())
      .get(`/api/v1/evidence/${evidence.id}/verify-integrity`)
      .set(fixtures.authHeader(ownerA));

    mockFetchOnce(content);
    const second = await request(server())
      .get(`/api/v1/evidence/${evidence.id}/verify-integrity`)
      .set(fixtures.authHeader(ownerA));

    expect(first.body.calculatedHash).toBe(second.body.calculatedHash);
    expect(first.body.isValid).toBe(true);
    expect(second.body.isValid).toBe(true);
  });

  it('NEGATIVO — detecta sustitución del recurso tras confirmarlo (mismo canonicalUri, contenido distinto)', async () => {
    const original = 'contenido-original';
    const sustituido = 'contenido-sustituido-por-atacante';
    const { evidence, ownerA } = await createEvidenceWithVersion(original);

    // Simula que alguien reemplazó el archivo en el storage bajo la misma URL.
    mockFetchOnce(sustituido);

    const res = await request(server())
      .get(`/api/v1/evidence/${evidence.id}/verify-integrity`)
      .set(fixtures.authHeader(ownerA));

    expect(res.status).toBe(200);
    expect(res.body.isValid).toBe(false);
    expect(res.body.expectedHash).not.toBe(res.body.calculatedHash);
  });

  it('NEGATIVO — alterar un solo byte del archivo hace fallar la verificación', async () => {
    const original = 'contenido-integro-de-prueba';
    const alterado = 'contenido-integro-de-pruebA'; // último byte cambiado
    const { evidence, ownerA } = await createEvidenceWithVersion(original);

    mockFetchOnce(alterado);

    const res = await request(server())
      .get(`/api/v1/evidence/${evidence.id}/verify-integrity`)
      .set(fixtures.authHeader(ownerA));

    expect(res.body.isValid).toBe(false);
  });

  it('NEGATIVO — dos evidencias con la misma URL lógica pero contenido distinto no comparten hash', async () => {
    const { evidence: evidenceA, ownerA } = await createEvidenceWithVersion('archivo-version-1');
    const { evidence: evidenceB, ownerA: ownerB } = await createEvidenceWithVersion('archivo-version-2-distinto');

    expect(evidenceA.canonicalUri).toBe(evidenceB.canonicalUri); // misma URL lógica

    const versionRepo = ctx.dataSource.getRepository(EvidenceVersion);
    const vA = await versionRepo.findOne({ where: { evidenceId: evidenceA.id } });
    const vB = await versionRepo.findOne({ where: { evidenceId: evidenceB.id } });

    expect(vA!.contentHash).not.toBe(vB!.contentHash);
    void ownerB; // documentado, no se usa directamente
    void EvidenceStatus; void ownerA;
  });

  it('400 cuando la evidencia no tiene versión de archivo para verificar', async () => {
    const { instanceA, ownerA } = await fixtures.createTwoTenantScenario();
    const evidence = await fixtures.createEvidence({
      microActionInstanceId: instanceA.id,
      authorUserId: ownerA.id,
      projectId: instanceA.projectId,
      canonicalUri: null as unknown as string,
    });

    await request(server())
      .get(`/api/v1/evidence/${evidence.id}/verify-integrity`)
      .set(fixtures.authHeader(ownerA))
      .expect(400);
  });
});