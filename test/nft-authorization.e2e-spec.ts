// test/nft-authorization.e2e-spec.ts

import request from 'supertest';
import { createTestApp, cleanDatabase, closeTestApp, E2eContext } from './e2e-setup';
import { Fixtures } from './fixtures';
import { UserRole } from 'src/users/entities/user.entity';

describe('NFT Actor & Mecenas Portfolio — SEC-006C (IDOR) (e2e)', () => {
  let ctx: E2eContext;
  let fixtures: Fixtures;
  const server = () => ctx.app.getHttpServer();

  beforeAll(async () => {
    ctx = await createTestApp();
    fixtures = new Fixtures(ctx.app);
  });

  afterEach(async () => {
    await cleanDatabase(ctx.dataSource);
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  describe('PATCH /api/v1/nft-actor/:id', () => {
    it('403 al intentar modificar un NFT Actor ajeno', async () => {
      const owner = await fixtures.createUser(UserRole.MENTOR, { cryptoWallet: '0xowner' });
      const attacker = await fixtures.createUser(UserRole.MENTOR, { cryptoWallet: '0xattacker' });
      const nftActor = await fixtures.createNftActorFixture(owner.id);

      await request(server())
        .patch(`/api/v1/nft-actor/${nftActor.id}`)
        .set(fixtures.authHeader(attacker))
        .send({ nftHash: 'hackeado' })
        .expect(403);
    });

    it('200 cuando el propietario modifica su propio NFT Actor', async () => {
      const owner = await fixtures.createUser(UserRole.MENTOR, { cryptoWallet: '0xowner' });
      const nftActor = await fixtures.createNftActorFixture(owner.id);

      await request(server())
        .patch(`/api/v1/nft-actor/${nftActor.id}`)
        .set(fixtures.authHeader(owner))
        .send({ nftHash: 'actualizado-por-dueno' })
        .expect(200);
    });

    it('200 cuando ADMIN modifica un NFT Actor ajeno', async () => {
      const owner = await fixtures.createUser(UserRole.MENTOR, { cryptoWallet: '0xowner' });
      const admin = await fixtures.createUser(UserRole.ADMIN, { cryptoWallet: '0xadmin' });
      const nftActor = await fixtures.createNftActorFixture(owner.id);

      await request(server())
        .patch(`/api/v1/nft-actor/${nftActor.id}`)
        .set(fixtures.authHeader(admin))
        .send({ nftHash: 'actualizado-por-admin' })
        .expect(200);
    });

    it('403 si el titular no tiene wallet vinculada a su identidad', async () => {
      const owner = await fixtures.createUser(UserRole.MENTOR, { cryptoWallet: undefined });
      const nftActor = await fixtures.createNftActorFixture(owner.id);

      await request(server())
        .patch(`/api/v1/nft-actor/${nftActor.id}`)
        .set(fixtures.authHeader(owner))
        .send({ nftHash: 'sin-wallet' })
        .expect(403);
    });
  });

  describe('PATCH /api/v1/mecenas-nft-portfolio/nft-project/:id', () => {
    it('403 al intentar editar una entrada de portafolio de otro usuario', async () => {
      const mecenas = await fixtures.createUser(UserRole.MECENAS_SEMILLA, {
        cryptoWallet: '0xmecenas',
      });
      const attacker = await fixtures.createUser(UserRole.MECENAS_SEMILLA, {
        cryptoWallet: '0xattacker',
      });
      const nftProject = await fixtures.createNftProjectFixture();
      const portfolio = await fixtures.createMecenasPortfolioFixture(mecenas.id, nftProject.id);

      await request(server())
        .patch(`/api/v1/mecenas-nft-portfolio/nft-project/${portfolio.id}`)
        .set(fixtures.authHeader(attacker))
        .send({ portfolioRole: 'guardian' })
        .expect(403);
    });

    it('200 cuando el mecenas dueño edita su propia entrada', async () => {
      const mecenas = await fixtures.createUser(UserRole.MECENAS_SEMILLA, {
        cryptoWallet: '0xmecenas',
      });
      const nftProject = await fixtures.createNftProjectFixture();
      const portfolio = await fixtures.createMecenasPortfolioFixture(mecenas.id, nftProject.id);

      await request(server())
        .patch(`/api/v1/mecenas-nft-portfolio/nft-project/${portfolio.id}`)
        .set(fixtures.authHeader(mecenas))
        .send({ portfolioRole: 'guardian' })
        .expect(200);
    });

    it('403 al asignar targetProjectId de un proyecto sin relación autorizada', async () => {
      const mecenas = await fixtures.createUser(UserRole.MECENAS_SEMILLA, {
        cryptoWallet: '0xmecenas',
      });
      const strangerOwner = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const strangerProject = await fixtures.createProject(strangerOwner.id);
      const nftProject = await fixtures.createNftProjectFixture();
      const portfolio = await fixtures.createMecenasPortfolioFixture(mecenas.id, nftProject.id);

      await request(server())
        .patch(`/api/v1/mecenas-nft-portfolio/nft-project/${portfolio.id}`)
        .set(fixtures.authHeader(mecenas))
        .send({ targetProjectId: strangerProject.id })
        .expect(403);
    });

    it('200 al asignar targetProjectId de un proyecto donde el mecenas es miembro activo', async () => {
      const mecenas = await fixtures.createUser(UserRole.MECENAS_SEMILLA, {
        cryptoWallet: '0xmecenas',
      });
      const projectOwner = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const project = await fixtures.createProject(projectOwner.id);
      await fixtures.addProjectMember(project.id, mecenas.id);

      const nftProject = await fixtures.createNftProjectFixture();
      const portfolio = await fixtures.createMecenasPortfolioFixture(mecenas.id, nftProject.id);

      await request(server())
        .patch(`/api/v1/mecenas-nft-portfolio/nft-project/${portfolio.id}`)
        .set(fixtures.authHeader(mecenas))
        .send({ targetProjectId: project.id })
        .expect(200);
    });
  });
});