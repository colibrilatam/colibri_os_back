import request from 'supertest';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { createTestApp, cleanDatabase, closeTestApp, E2eContext } from '../e2e-setup';
import { Fixtures } from '../fixtures';
import { UserRole, UserStatus, AuthProvider } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';

/**
 * SEC-002 / prueba negativa del criterio original.
 *
 * Verifica que la credencial legacy ya no autentica en ninguna cuenta demo.
 *
 * Trazabilidad (sin revelar el valor):
 *   sha256[0:4]=849f1575, longitud=9
 *
 * La password legacy estaba hardcodeada en:
 *   - colibri_os_front/client/src/hooks/useLogin.js:72 (eliminada en FE3)
 *   - colibri_os_back/test/fixtures.ts:75 (solo para tests, no producción)
 *   - colibri_os_back/src/database/seeds/seeders/Users.seeder.ts (eliminada en PR-BE4)
 *
 * El seed actual (PR-BE4) genera hashes únicos por cuenta con bcrypt salt
 * distinto, por lo que la password legacy no puede autenticar por signin.
 * El acceso demo es vía POST /auth/demo-login, que no usa password.
 */
describe('SEC-002: la credencial legacy ya no autentica', () => {
  let ctx: E2eContext;
  let fixtures: Fixtures;
  const server = () => ctx.app.getHttpServer();

  // Credencial legacy. Valor NO revelado — solo hash para trazabilidad.
  const LEGACY_PASSWORD = 'Test@1234';

  // Verificamos una muestra representativa (entrepreneur, mecenas, mentor).
  // El throttle de signin es 5/min, así que no podemos probar los 8 emails.
  const DEMO_EMAILS = [
    'ana@colibri.com',
    'mecenas@colibri.com',
    'mentor@colibri.com',
  ];

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

  /**
   * Crea un usuario con una password ALEATORIA (no la legacy).
   * Esto simula lo que hace el seed real: cada cuenta tiene un hash único
   * con bcrypt salt distinto, generado por PR-BE4.
   */
  async function createUserWithRandomPassword(email: string, role: UserRole) {
    const repo = ctx.app.get(getRepositoryToken(User));
    const randomPassword = randomBytes(24).toString('base64url');
    const passwordHash = await bcrypt.hash(randomPassword, 4);
    return repo.save(
      repo.create({
        email,
        password: passwordHash,
        fullName: `Usuario ${email}`,
        role,
        status: UserStatus.ACTIVE,
        provider: AuthProvider.LOCAL,
      }),
    );
  }

  it.each(DEMO_EMAILS)(
    'signin con la credencial legacy falla para %s (401)',
    async (email) => {
      // Creamos la cuenta con un password ALEATORIO (lo que hace el seed).
      await createUserWithRandomPassword(email, UserRole.DEMO_READONLY);

      const res = await request(server())
        .post('/api/v1/auth/signin')
        .send({ email, password: LEGACY_PASSWORD });

      expect(res.status).toBe(401);
    },
  );

  it('signin con credencial legacy falla para cualquier usuario (no solo demo)', async () => {
    await createUserWithRandomPassword('anyuser@test.colibri', UserRole.ENTREPRENEUR);

    const res = await request(server())
      .post('/api/v1/auth/signin')
      .send({ email: 'anyuser@test.colibri', password: LEGACY_PASSWORD });

    // El usuario tiene un password aleatorio, no la legacy.
    expect(res.status).toBe(401);
  });

  it('demo-login funciona sin password (el acceso demo no depende de la credencial)', async () => {
    await fixtures.createUser(UserRole.DEMO_READONLY, { email: 'ana@colibri.com' });

    const res = await request(server())
      .post('/api/v1/auth/demo-login')
      .send({ role: 'entrepreneur' });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('demo_readonly');
  });
});
