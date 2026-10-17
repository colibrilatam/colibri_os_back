import { runSeedScript } from '../helpers/run-seed-script';

/**
 * SEC-002 / CA3: el seed no puede correr contra un host de producción.
 *
 * Ejecuta el script real como proceso hijo con DATABASE_URL apuntando a un
 * host que NO está en la allowlist, y verifica que el proceso ABORTA
 * (exit code != 0) ANTES de conectar a la base.
 *
 * El guard es fail-fast (process.exit(1)), no un warning. Si alguien
 * configura mal el DATABASE_URL, el seed se detiene antes del TRUNCATE.
 *
 * Nota: los hosts de prueba son ficticios (`.invalid` es un TLD reservado
 * por RFC 2606 que nunca resuelve). No se usa ningún host real.
 */
describe('SEC-002 / CA3: seed aislado — aborta contra host de producción', () => {
  const runSeed = runSeedScript;

  it('aborta si DATABASE_URL apunta a un host externo (no localhost)', () => {
    const result = runSeed({
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://user:pass@db.supabase.example.invalid:5432/postgres',
      CONFIRM_DESTRUCTIVE_SEED: 'yes-destroy-data',
      SEED_ALLOWED_HOSTS: undefined, // sin allowlist extra
    });

    expect(result.status).not.toBe(0);
    expect(result.output).toContain('no está en la lista de hosts permitidos');
    // El log estructurado también registra el evento.
    expect(result.output).toContain('seed_blocked_host_not_allowed');
  });

  it('aborta incluso con CONFIRM_DESTRUCTIVE_SEED correcto (el host se chequea primero)', () => {
    const result = runSeed({
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://user:pass@179.199.131.185:5432/postgres',
      CONFIRM_DESTRUCTIVE_SEED: 'yes-destroy-data',
      SEED_ALLOWED_HOSTS: undefined,
    });

    expect(result.status).not.toBe(0);
    expect(result.output).toContain('no está en la lista de hosts permitidos');
  });

  it('permite localhost (host por defecto en la allowlist)', () => {
    // localhost siempre está en DEFAULT_ALLOWED_HOSTS. El seed puede
    // fallar por otras razones (DB no disponible, falta de migraciones),
    // pero NO por el guard de host.
    const result = runSeed({
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://postgres:pass@localhost:5432/colibri_db',
      CONFIRM_DESTRUCTIVE_SEED: 'yes-destroy-data',
      SEED_ALLOWED_HOSTS: undefined,
    });

    expect(result.output).not.toContain('no está en la lista de hosts permitidos');
  });

  it('permite un host declarado en SEED_ALLOWED_HOSTS', () => {
    const result = runSeed({
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://postgres:pass@demo-db.internal.example.invalid:5432/colibri_demo',
      CONFIRM_DESTRUCTIVE_SEED: 'yes-destroy-data',
      SEED_ALLOWED_HOSTS: 'demo-db.internal.example.invalid',
    });

    expect(result.output).not.toContain('no está en la lista de hosts permitidos');
  });
});
