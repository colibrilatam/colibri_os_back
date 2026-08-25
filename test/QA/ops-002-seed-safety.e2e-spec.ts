// test/QA/ops-002-seed-safety.e2e-spec.ts
import { execFileSync } from 'child_process';
import { join } from 'path';

/**
 * OPS-002: pruebas negativas del kill-switch de seeds.
 *
 * Estos tests corren el script real (ts-node) como proceso hijo con distintas
 * combinaciones de variables de entorno, y verifican que las corridas
 * inseguras se aborten (exit code != 0) SIN llegar a tocar la base.
 *
 * Nota: no seteamos DATABASE_URL a una base real en los casos de bloqueo,
 * porque justamente el objetivo es que el script aborte ANTES de conectar.
 */
describe('OPS-002: seguridad del script de seed (negative tests)', () => {
  const seedScript = join(__dirname, '..', '..', 'src', 'database', 'seeds', 'seed.ts');

  function runSeed(env: Record<string, string | undefined>): { status: number; output: string } {
    try {
      const output = execFileSync(
        'npx',
        ['ts-node', '-r', 'tsconfig-paths/register', seedScript],
        {
          env: { ...process.env, ...env },
          encoding: 'utf-8',
          timeout: 15_000,
        },
      );
      return { status: 0, output };
    } catch (error: any) {
      return {
        status: typeof error.status === 'number' ? error.status : 1,
        output: `${error.stdout ?? ''}${error.stderr ?? ''}`,
      };
    }
  }

  it('aborta si NODE_ENV=production, sin importar otras banderas', () => {
    const result = runSeed({
      NODE_ENV: 'production',
      CONFIRM_DESTRUCTIVE_SEED: 'yes-destroy-data',
      DATABASE_URL: undefined,
    });

    expect(result.status).not.toBe(0);
    expect(result.output).toContain('NODE_ENV=production');
  });

  it('aborta si falta CONFIRM_DESTRUCTIVE_SEED', () => {
    const result = runSeed({
      NODE_ENV: 'development',
      CONFIRM_DESTRUCTIVE_SEED: undefined,
      DATABASE_URL: undefined,
    });

    expect(result.status).not.toBe(0);
    expect(result.output).toContain('CONFIRM_DESTRUCTIVE_SEED');
  });

  it('aborta si CONFIRM_DESTRUCTIVE_SEED tiene un valor incorrecto', () => {
    const result = runSeed({
      NODE_ENV: 'development',
      CONFIRM_DESTRUCTIVE_SEED: 'true', // valor viejo/adivinado, no el exigido
      DATABASE_URL: undefined,
    });

    expect(result.status).not.toBe(0);
  });
});