import { execFileSync } from 'child_process';
import { join } from 'path';

/**
 * SEC-002: ejecuta src/database/seeds/seed.ts como proceso hijo con un
 * entorno controlado, y captura stdout+stderr.
 *
 * En Windows, `execFileSync` sin `shell` no puede ejecutar `.cmd` (npx.cmd).
 * En su lugar, invocamos `node` directamente con el binario de ts-node —
 * esto funciona en todas las plataformas sin `shell: true`, eliminando
 * cualquier vector de inyección de shell.
 *
 * Los argumentos son literales controlados por el test — no hay input de
 * usuario — pero el helper es seguro por diseño en cualquier plataforma.
 */
export function runSeedScript(
  env: Record<string, string | undefined>,
): { status: number; output: string } {
  const seedScript = join(__dirname, '..', '..', 'src', 'database', 'seeds', 'seed.ts');
  const tsNodeBin = join(__dirname, '..', '..', 'node_modules', 'ts-node', 'dist', 'bin.js');

  try {
    const output = execFileSync(
      process.execPath, // node
      [tsNodeBin, '-r', 'tsconfig-paths/register', seedScript],
      {
        env: { ...process.env, ...env },
        encoding: 'utf-8',
        timeout: 15_000,
        shell: false,
        windowsHide: true,
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