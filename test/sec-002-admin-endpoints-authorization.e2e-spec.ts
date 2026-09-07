import request from 'supertest';
import { createTestApp, cleanDatabase, closeTestApp, E2eContext } from './e2e-setup';
import { Fixtures } from './fixtures';
import { UserRole } from 'src/users/entities/user.entity';

describe('SEC-002 — autorización explícita en endpoints administrativos (e2e)', () => {
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

  describe('POST /api/v1/categories', () => {
    const validBody = (tramoId: string) => ({
      tramoId,
      code: 'CAT-SEC-002',
      name_es: 'Categoría',
      name_en: 'Category',
      sortOrder: 1,
    });

    it('401 sin JWT', async () => {
      const tramo = await fixtures.createTramo();
      await request(server())
        .post('/api/v1/categories')
        .send(validBody(tramo.id))
        .expect(401);
    });

    it('403 con un usuario sin privilegios (no admin)', async () => {
      const tramo = await fixtures.createTramo();
      const entrepreneur = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .post('/api/v1/categories')
        .set(fixtures.authHeader(entrepreneur))
        .send(validBody(tramo.id))
        .expect(403);
    });

    it('la escritura denegada no altera la base de datos', async () => {
      const tramo = await fixtures.createTramo();
      const entrepreneur = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .post('/api/v1/categories')
        .set(fixtures.authHeader(entrepreneur))
        .send(validBody(tramo.id));

      const count = await ctx.dataSource.query(
        `SELECT COUNT(*)::int AS count FROM categories WHERE code = $1`,
        ['CAT-SEC-002'],
      );
      expect(count[0].count).toBe(0);
    });

    it('201 cuando lo pide un ADMIN', async () => {
      const tramo = await fixtures.createTramo();
      const admin = await fixtures.createUser(UserRole.ADMIN);

      await request(server())
        .post('/api/v1/categories')
        .set(fixtures.authHeader(admin))
        .send(validBody(tramo.id))
        .expect(201);
    });
  });

  describe('PATCH y DELETE /api/v1/categories/:id sin privilegios', () => {
    it('403 al editar una categoría siendo MENTOR', async () => {
      const tramo = await fixtures.createTramo();
      const category = await fixtures.createCategory(tramo.id);
      const mentor = await fixtures.createUser(UserRole.MENTOR);

      await request(server())
        .patch(`/api/v1/categories/${category.id}`)
        .set(fixtures.authHeader(mentor))
        .send({ name_es: 'Nombre hackeado' })
        .expect(403);
    });

    it('403 al borrar una categoría siendo EVALUATOR', async () => {
      const tramo = await fixtures.createTramo();
      const category = await fixtures.createCategory(tramo.id);
      const evaluator = await fixtures.createUser(UserRole.EVALUATOR);

      await request(server())
        .delete(`/api/v1/categories/${category.id}`)
        .set(fixtures.authHeader(evaluator))
        .expect(403);
    });
  });

  describe('POST /api/v1/pacs', () => {
    it('401 sin JWT y 403 sin privilegios', async () => {
      const tramo = await fixtures.createTramo();
      const category = await fixtures.createCategory(tramo.id);
      const guest = await fixtures.createUser(UserRole.GUEST);
      const body = { categoryId: category.id, code: 'PAC-SEC-002', title_es: 't', title_en: 't', sortOrder: 1 };

      await request(server()).post('/api/v1/pacs').send(body).expect(401);

      await request(server())
        .post('/api/v1/pacs')
        .set(fixtures.authHeader(guest))
        .send(body)
        .expect(403);
    });
  });

  describe('POST /api/v1/micro-action-definitions', () => {
    it('401 sin JWT y 403 sin privilegios', async () => {
      const tramo = await fixtures.createTramo();
      const category = await fixtures.createCategory(tramo.id);
      const pac = await fixtures.createPac(category.id);
      const entrepreneur = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const body = {
        pacId: pac.id,
        code: 'MAD-SEC-002',
        instruction_es: 'x',
        instruction_en: 'x',
        sortOrder: 1,
      };

      await request(server()).post('/api/v1/micro-action-definitions').send(body).expect(401);

      await request(server())
        .post('/api/v1/micro-action-definitions')
        .set(fixtures.authHeader(entrepreneur))
        .send(body)
        .expect(403);
    });
  });

  describe('GET y DELETE /api/v1/nft-projects (el hallazgo crítico)', () => {
    it('403 al listar todos los NFTs de proyecto sin ser ADMIN', async () => {
      await fixtures.createNftProjectFixture();
      const mentor = await fixtures.createUser(UserRole.MENTOR);

      await request(server())
        .get('/api/v1/nft-projects')
        .set(fixtures.authHeader(mentor))
        .expect(403);
    });

    it('401 al intentar borrar un NFT de proyecto sin JWT', async () => {
      const nft = await fixtures.createNftProjectFixture();

      await request(server()).delete(`/api/v1/nft-projects/${nft.id}`).expect(401);
    });

    it('403 al intentar borrar un NFT de proyecto ajeno sin ser ADMIN', async () => {
      const nft = await fixtures.createNftProjectFixture();
      const outsider = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .delete(`/api/v1/nft-projects/${nft.id}`)
        .set(fixtures.authHeader(outsider))
        .expect(403);
    });

    it('el borrado denegado no elimina el registro de la base de datos', async () => {
      const nft = await fixtures.createNftProjectFixture();
      const outsider = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .delete(`/api/v1/nft-projects/${nft.id}`)
        .set(fixtures.authHeader(outsider));

      const stillExists = await ctx.dataSource.query(
        `SELECT COUNT(*)::int AS count FROM nft_projects WHERE id = $1`,
        [nft.id],
      );
      expect(stillExists[0].count).toBe(1);
    });

    it('204 cuando un ADMIN borra el NFT de proyecto', async () => {
      const nft = await fixtures.createNftProjectFixture();
      const admin = await fixtures.createUser(UserRole.ADMIN);

      await request(server())
        .delete(`/api/v1/nft-projects/${nft.id}`)
        .set(fixtures.authHeader(admin))
        .expect(204);
    });
  });
});