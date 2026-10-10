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

  // ─── B2–B4 · pendientes de PR-BE2 ───────────────────────────────────────────

  describe('B2 — tramos exige guards', () => {
    // SEC-002: pendiente PR-BE2 (`//@UseGuards(...)` comentado en tramos.controller.ts:38)
    it.skip('401 sin JWT en POST /api/v1/tramos', async () => {});
    it.skip('403 con usuario no ADMIN', async () => {});
  });

  describe('B3 — digital-credentials revoke exige ADMIN', () => {
    // SEC-002: pendiente PR-BE2 (`@Roles(ADMIN)` comentado en digital-credentials.controller.ts:64)
    it.skip('403 para un ENTREPRENEUR autenticado', async () => {});
  });

  describe('B4 — mecenas-semilla activate exige ADMIN', () => {
    // SEC-002: pendiente PR-BE2 (`@Roles(ADMIN)` comentado en mecenas-semilla.controller.ts:21)
    it.skip('403 para un MENTOR autenticado', async () => {});
  });
});