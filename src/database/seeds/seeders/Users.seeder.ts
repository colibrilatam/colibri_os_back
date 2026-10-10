import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { DataSource } from 'typeorm';
import { AuthProvider, Gender, User, UserRole, UserStatus } from 'src/users/entities/user.entity';

/**
 * SEC-002 / PR-BE4: siembra las cuentas demo con rol `demo_readonly`.
 *
 * Todas las cuentas comparten el mismo `seedPassword` (resuelto por seed.ts),
 * pero cada una recibe un hash distinto (bcrypt genera un salt único por
 * hash). El acceso demo real es vía `POST /auth/demo-login`, que no usa
 * password — la password solo sirve como fallback para signin manual.
 */
export async function seedUsers(dataSource: DataSource, seedPassword: string) {
  const repo = dataSource.getRepository(User);

  // SEC-002: password por cuenta. bcrypt genera un salt único por hash,
  // por lo que aunque el valor de entrada sea el mismo, cada hash es
  // distinto y no se puede reutilizar entre cuentas.
  const hashFor = () => bcrypt.hash(`${seedPassword}-${randomBytes(8).toString('hex')}`, 10);

  const demoUsers = repo.create([
    // ─── Perfiles "entrepreneur" (datos de proyecto, rol demo) ─────────────
    {
      email: 'lucas@colibri.com',
      password: await hashFor(),
      fullName: 'Lucas Emprendedor',
      role: UserRole.DEMO_READONLY,
      gender: Gender.MALE,
      status: UserStatus.ACTIVE,
      provider: AuthProvider.LOCAL,
    },
    {
      email: 'ana@colibri.com',
      password: await hashFor(),
      fullName: 'Ana Startup',
      role: UserRole.DEMO_READONLY,
      gender: Gender.FEMALE,
      status: UserStatus.ACTIVE,
      provider: AuthProvider.LOCAL,
    },
    {
      email: 'martin@colibri.com',
      password: await hashFor(),
      fullName: 'Martin Founder',
      role: UserRole.DEMO_READONLY,
      gender: Gender.FEMALE,
      status: UserStatus.ACTIVE,
      provider: AuthProvider.LOCAL,
    },
    {
      email: 'sofia@colibri.com',
      password: await hashFor(),
      fullName: 'Sofia Builder',
      role: UserRole.DEMO_READONLY,
      gender: Gender.FEMALE,
      status: UserStatus.ACTIVE,
      provider: AuthProvider.LOCAL,
    },

    // ─── Perfiles "mecenas" (datos de portafolio, rol demo) ────────────────
    {
      email: 'mecenas@colibri.com',
      password: await hashFor(),
      fullName: 'Sofia Mecenas',
      role: UserRole.DEMO_READONLY,
      gender: Gender.FEMALE,
      status: UserStatus.ACTIVE,
      provider: AuthProvider.LOCAL,
    },
    {
      email: 'BancoDV@colibri.com',
      password: await hashFor(),
      fullName: 'Banco De Venezuela',
      role: UserRole.DEMO_READONLY,
      gender: Gender.MALE,
      status: UserStatus.ACTIVE,
      provider: AuthProvider.LOCAL,
    },

    // ─── Perfil "mentor" (datos de revisión, rol demo) ─────────────────────
    {
      email: 'mentor@colibri.com',
      password: await hashFor(),
      fullName: 'Carlos Mentor',
      role: UserRole.DEMO_READONLY,
      gender: Gender.MALE,
      status: UserStatus.ACTIVE,
      provider: AuthProvider.LOCAL,
    },

    // ─── Perfil "evaluator" (datos de evaluación, rol demo) ────────────────
    {
      email: 'evaluator@colibri.com',
      password: await hashFor(),
      fullName: 'María Evaluadora',
      role: UserRole.DEMO_READONLY,
      gender: Gender.FEMALE,
      status: UserStatus.ACTIVE,
      provider: AuthProvider.LOCAL,
    },
  ]);

  const saved = await repo.save(demoUsers);
  console.log('✅ Usuarios demo creados:', saved.length, '(rol: demo_readonly)');
  return saved;
}