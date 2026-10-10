import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { createTestApp, cleanDatabase, closeTestApp, E2eContext } from '../e2e-setup';
import { Fixtures } from '../fixtures';
import { UserRole, UserStatus, AuthProvider, Gender } from 'src/users/entities/user.entity';

/**
 * SEC-002 — regresión de escalada de privilegios.
 *
 * Contexto: `POST /auth/complete-profile` es público (solo exige un token de
 * propósito `profile-completion`) y su DTO aceptaba `@IsEnum(UserRole)` completo.
 * Eso permitía que un usuario de Google recién registrado se auto-asignara
 * `admin` y escalara sin ningún privilegio previo. Se conoce como B1.
 *
 * La corrección vive en `src/auth/allowed-roles.ts` (fuente única) y se aplica
 * en dos capas: el DTO (`@IsIn`) y el servicio (`assertSelfAssignableRole`).
 */
describe('SEC-002 — regresión de escalada de privilegios (B1–B4)', () => {
  let ctx: E2eContext;
  let fixtures: Fixtures;
  let jwtService: JwtService;
  const server = () => ctx.app.getHttpServer();

  beforeAll(async () => {
    ctx = await createTestApp();
    fixtures = new Fixtures(ctx.app);
    jwtService = ctx.app.get(JwtService);
  });

  afterEach(async () => {
    await cleanDatabase(ctx.dataSource);
  });

  afterAll(async () => {
    await closeTestApp(ctx);
  });

  /** Usuario OAuth sin perfil completo: sin rol y con token de onboarding válido. */
  const pendingGoogleUser = () =>
    fixtures.createUser(UserRole.ENTREPRENEUR, {
      role: null,
      status: UserStatus.PENDING_PROFILE,
      provider: AuthProvider.GOOGLE,
    });

  const profileCompletionTokenFor = (userId: string) =>
    jwtService.sign({ sub: userId, purpose: 'profile-completion' }, { expiresIn: '1h' });

  const readRole = async (userId: string): Promise<string | null> => {
    const rows = await ctx.dataSource.query(
      `SELECT role FROM users WHERE id = $1`,
      [userId],
    );
    return rows[0]?.role ?? null;
  };

  // ─── B1 · POST /auth/complete-profile ────────────────────────────────────────

  describe('B1 — complete-profile no permite auto-asignar un rol privilegiado', () => {
    const PRIVILEGED_ROLES = [
      UserRole.ADMIN,
      UserRole.DEMO_READONLY,
      UserRole.MENTOR,
      UserRole.MECENAS_SEMILLA,
      UserRole.MECENAS_FUNDACIONAL,
      UserRole.MECENAS_CAMBIO,
    ];

    it.each(PRIVILEGED_ROLES)('rechaza role=%s con 400', async (role) => {
      const user = await pendingGoogleUser();

      const res = await request(server())
        .post('/api/v1/auth/complete-profile')
        .send({
          profileCompletionToken: profileCompletionTokenFor(user.id),
          role,
          gender: Gender.OTHER,
        });

      expect(res.status).toBe(400);
    });

    it.each(PRIVILEGED_ROLES)('el rechazo de role=%s deja el rol sin tocar', async (role) => {
      const user = await pendingGoogleUser();

      await request(server())
        .post('/api/v1/auth/complete-profile')
        .send({
          profileCompletionToken: profileCompletionTokenFor(user.id),
          role,
          gender: Gender.OTHER,
        });

      expect(await readRole(user.id)).toBeNull();
    });

    it('la escalada a admin no emite sesión', async () => {
      const user = await pendingGoogleUser();

      const res = await request(server())
        .post('/api/v1/auth/complete-profile')
        .send({
          profileCompletionToken: profileCompletionTokenFor(user.id),
          role: UserRole.ADMIN,
          gender: Gender.OTHER,
        });

      expect(res.status).toBe(400);
      expect(res.body.token).toBeUndefined();
    });

    it.each([UserRole.ENTREPRENEUR, UserRole.EVALUATOR])(
      'sigue permitiendo role=%s y activa la cuenta',
      async (role) => {
        const user = await pendingGoogleUser();

        const res = await request(server())
          .post('/api/v1/auth/complete-profile')
          .send({
            profileCompletionToken: profileCompletionTokenFor(user.id),
            role,
            gender: Gender.OTHER,
          });

        expect(res.status).toBe(201);
        expect(res.body.user.role).toBe(role);
        expect(await readRole(user.id)).toBe(role);
      },
    );

    it('sigue rechazando un token sin propósito profile-completion', async () => {
      const user = await pendingGoogleUser();

      const res = await request(server())
        .post('/api/v1/auth/complete-profile')
        .send({
          profileCompletionToken: fixtures.tokenFor(user),
          role: UserRole.ENTREPRENEUR,
          gender: Gender.OTHER,
        });

      expect(res.status).toBe(401);
    });
  });

  // ─── Migración de enum · PR-BE1 ─────────────────────────────────────────────

  describe('Migración: el enum users_role_enum acepta demo_readonly', () => {
    it('puede crear un usuario con role=demo_readonly', async () => {
      // Si la migración AddDemoReadonlyRole no se ejecutó, esto falla con
      // `invalid input value for enum users_role_enum`.
      const demo = await fixtures.createUser(UserRole.DEMO_READONLY);

      expect(demo.role).toBe(UserRole.DEMO_READONLY);
      expect(await readRole(demo.id)).toBe(UserRole.DEMO_READONLY);
    });

    it('el enum en la DB contiene el valor demo_readonly', async () => {
      const rows = await ctx.dataSource.query(
        `SELECT e.enumlabel FROM pg_enum e
         JOIN pg_type t ON e.enumtypid = t.oid
         WHERE t.typname = 'users_role_enum' AND e.enumlabel = 'demo_readonly'`,
      );
      expect(rows).toHaveLength(1);
    });
  });

  // ─── B2–B4 · cerrados en PR-BE2 ─────────────────────────────────────────────

  describe('B2 — tramos exige guards', () => {
    const validTramo = () => ({
      code: `TRAMO-B2-${Date.now()}`,
      name_es: 'Tramo de prueba',
      name_en: 'Test tramo',
      sortOrder: 1,
    });

    it('401 sin JWT en POST /api/v1/tramos', async () => {
      await request(server())
        .post('/api/v1/tramos')
        .send(validTramo())
        .expect(401);
    });

    it('403 con un ENTREPRENEUR (no ADMIN)', async () => {
      const entrepreneur = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .post('/api/v1/tramos')
        .set(fixtures.authHeader(entrepreneur))
        .send(validTramo())
        .expect(403);
    });

    it('201 con un ADMIN', async () => {
      const admin = await fixtures.createUser(UserRole.ADMIN);

      await request(server())
        .post('/api/v1/tramos')
        .set(fixtures.authHeader(admin))
        .send(validTramo())
        .expect(201);
    });
  });

  describe('B3 — digital-credentials revoke exige ADMIN', () => {
    const fakeCredentialId = '00000000-0000-4000-8000-000000000001';

    it('401 sin JWT', async () => {
      await request(server())
        .post(`/api/v1/digital-credentials/${fakeCredentialId}/revoke`)
        .send({ reason: 'test' })
        .expect(401);
    });

    it('403 para un ENTREPRENEUR autenticado', async () => {
      const entrepreneur = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .post(`/api/v1/digital-credentials/${fakeCredentialId}/revoke`)
        .set(fixtures.authHeader(entrepreneur))
        .send({ reason: 'test' })
        .expect(403);
    });

    it('403 para un MENTOR autenticado', async () => {
      const mentor = await fixtures.createUser(UserRole.MENTOR);

      await request(server())
        .post(`/api/v1/digital-credentials/${fakeCredentialId}/revoke`)
        .set(fixtures.authHeader(mentor))
        .send({ reason: 'test' })
        .expect(403);
    });
  });

  describe('B4 — mecenas-semilla activate exige ADMIN', () => {
    it('401 sin JWT', async () => {
      const target = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .post(`/api/v1/mecenas-semilla/activate/${target.id}`)
        .expect(401);
    });

    it('403 para un MENTOR autenticado', async () => {
      const mentor = await fixtures.createUser(UserRole.MENTOR);
      const target = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .post(`/api/v1/mecenas-semilla/activate/${target.id}`)
        .set(fixtures.authHeader(mentor))
        .expect(403);
    });

    it('403 para un ENTREPRENEUR autenticado', async () => {
      const caller = await fixtures.createUser(UserRole.ENTREPRENEUR);
      const target = await fixtures.createUser(UserRole.ENTREPRENEUR);

      await request(server())
        .post(`/api/v1/mecenas-semilla/activate/${target.id}`)
        .set(fixtures.authHeader(caller))
        .expect(403);
    });
  });

  // ─── DemoReadOnlyGuard · PR-BE2 ────────────────────────────────────────────

  describe('DemoReadOnlyGuard — demo_readonly solo puede hacer GET', () => {
    let demo: Awaited<ReturnType<typeof fixtures.createUser>>;
    let project: Awaited<ReturnType<typeof fixtures.createProject>>;

    beforeEach(async () => {
      const owner = await fixtures.createUser(UserRole.ENTREPRENEUR);
      project = await fixtures.createProject(owner.id);
      demo = await fixtures.createUser(UserRole.DEMO_READONLY);
    });

    describe('escrituras bloqueadas (403)', () => {
      it('POST /api/v1/projects', async () => {
        await request(server())
          .post('/api/v1/projects')
          .set(fixtures.authHeader(demo))
          .send({ projectName: 'No debo poder crear esto' })
          .expect(403);
      });

      it('PATCH /api/v1/projects/:id', async () => {
        await request(server())
          .patch(`/api/v1/projects/${project.id}`)
          .set(fixtures.authHeader(demo))
          .send({ projectName: 'Hackeado' })
          .expect(403);
      });

      it('DELETE /api/v1/projects/:id', async () => {
        await request(server())
          .delete(`/api/v1/projects/${project.id}`)
          .set(fixtures.authHeader(demo))
          .expect(403);
      });

      it('POST /api/v1/evidence', async () => {
        await request(server())
          .post('/api/v1/evidence')
          .set(fixtures.authHeader(demo))
          .send({ projectId: project.id, evidenceType: 'file' })
          .expect(403);
      });

      it('la escritura bloqueada no altera la base de datos', async () => {
        await request(server())
          .patch(`/api/v1/projects/${project.id}`)
          .set(fixtures.authHeader(demo))
          .send({ projectName: 'Hackeado' });

        const rows = await ctx.dataSource.query(
          `SELECT project_name FROM projects WHERE id = $1`,
          [project.id],
        );
        expect(rows[0].project_name).not.toBe('Hackeado');
      });
    });

    describe('lecturas permitidas', () => {
      it('GET /api/v1/projects → 200', async () => {
        await request(server())
          .get('/api/v1/projects')
          .set(fixtures.authHeader(demo))
          .expect(200);
      });

      it('GET /api/v1/categories → 200', async () => {
        await request(server())
          .get('/api/v1/categories')
          .set(fixtures.authHeader(demo))
          .expect(200);
      });
    });

    describe('excepciones del guard', () => {
      it('POST /auth/logout → 200 (el demo puede cerrar sesión)', async () => {
        await request(server())
          .post('/api/v1/auth/logout')
          .set(fixtures.authHeader(demo))
          .send({})
          .expect(200);
      });
    });

    describe('otros roles no se ven afectados', () => {
      it('un ENTREPRENEUR puede crear proyectos (no es demo)', async () => {
        const entrepreneur = await fixtures.createUser(UserRole.ENTREPRENEUR);

        await request(server())
          .post('/api/v1/projects')
          .set(fixtures.authHeader(entrepreneur))
          .send({ projectName: 'Proyecto legítimo' })
          .expect(201);
      });
    });
  });

  // ─── demo-login · PR-BE3 ──────────────────────────────────────────────────

  describe('POST /auth/demo-login — login demo sin contraseña', () => {
    /** Crea las 4 cuentas demo con role=demo_readonly (lo que hará el seed de PR-BE4). */
    const seedDemoAccounts = async () => {
      await fixtures.createUser(UserRole.DEMO_READONLY, { email: 'ana@colibri.com' });
      await fixtures.createUser(UserRole.DEMO_READONLY, { email: 'mentor@colibri.com' });
      await fixtures.createUser(UserRole.DEMO_READONLY, { email: 'evaluator@colibri.com' });
      await fixtures.createUser(UserRole.DEMO_READONLY, { email: 'mecenas@colibri.com' });
    };

    beforeEach(async () => {
      await seedDemoAccounts();
    });

    it('201 con body vacío (default entrepreneur)', async () => {
      const res = await request(server())
        .post('/api/v1/auth/demo-login')
        .send({});

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('ana@colibri.com');
    });

    it.each(['entrepreneur', 'mentor', 'evaluator', 'mecenas_semilla'] as const)(
      '201 con role=%s y setea la cookie de sesión',
      async (role) => {
        const res = await request(server())
          .post('/api/v1/auth/demo-login')
          .send({ role });

        expect(res.status).toBe(201);
        expect(res.headers['set-cookie']).toEqual(
          expect.arrayContaining([expect.stringContaining('colibri_access_token=')]),
        );
      },
    );

    it('el user.role de la respuesta es demo_readonly, no el rol elegido', async () => {
      const res = await request(server())
        .post('/api/v1/auth/demo-login')
        .send({ role: 'mentor' });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('demo_readonly');
    });

    it('no requiere password', async () => {
      const res = await request(server())
        .post('/api/v1/auth/demo-login')
        .send({ role: 'evaluator' });

      expect(res.status).toBe(201);
      // No hay campo password en la respuesta ni se pidió en el body.
      expect(res.body.user.password).toBeFalsy();
    });

    it('400 con un rol inválido', async () => {
      await request(server())
        .post('/api/v1/auth/demo-login')
        .send({ role: 'admin' })
        .expect(400);
    });

    it('401 si la cuenta demo no existe (seed no ejecutado)', async () => {
      await cleanDatabase(ctx.dataSource);

      await request(server())
        .post('/api/v1/auth/demo-login')
        .send({ role: 'entrepreneur' })
        .expect(401);
    });

    it('el token demo-read-only no puede escribir (DemoReadOnlyGuard activo)', async () => {
      // Usamos fixtures en vez del endpoint para no agotar el throttle
      // de demo-login (10/min) con tanta llamadas en la suite.
      const demo = await fixtures.createUser(UserRole.DEMO_READONLY, {
        email: 'guard-test@colibri.com',
      });

      await request(server())
        .post('/api/v1/projects')
        .set(fixtures.authHeader(demo))
        .send({ projectName: 'No debo poder' })
        .expect(403);
    });

    it('el token demo-read-only sí puede leer', async () => {
      const demo = await fixtures.createUser(UserRole.DEMO_READONLY, {
        email: 'guard-test2@colibri.com',
      });

      await request(server())
        .get('/api/v1/projects')
        .set(fixtures.authHeader(demo))
        .expect(200);
    });
  });
});