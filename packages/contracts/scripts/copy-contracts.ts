import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '..', '..', '..');
const contractsRoot = resolve(backendRoot, 'packages', 'contracts');

function resolveFrontendRoot(): string | null {
  const fromEnv = process.env.COLIBRI_FRONTEND_ROOT;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;

  const sibling = resolve(backendRoot, '..', 'colibri_os_front');
  if (existsSync(sibling)) return sibling;

  return null;
}

const frontendRoot = resolveFrontendRoot();

if (!frontendRoot) {
  console.warn('');
  console.warn('[copy-contracts] Frontend no encontrado.');
  console.warn('  Definir COLIBRI_FRONTEND_ROOT con la ruta al root del repo del frontend.');
  console.warn('  Ejemplo (PowerShell):  $env:COLIBRI_FRONTEND_ROOT="C:/PROGRAMACION/PROYECTOS/Colibri/colibri_os_front"');
  console.warn('  Ejemplo (bash):        export COLIBRI_FRONTEND_ROOT=/c/PROGRAMACION/PROYECTOS/Colibri/colibri_os_front');
  console.warn('');
  console.warn('  Se omite la copia. La generacion de schemas ya termino.');
  process.exit(0);
}

const dstRoot = resolve(frontendRoot, 'client', 'src', 'lib', 'contracts');

if (!existsSync(dstRoot)) {
  console.error(`[copy-contracts] Destino no existe: ${dstRoot}`);
  console.error('  Verificar que el frontend tenga client/src/lib/contracts/.');
  process.exit(1);
}

const files: [string, string][] = [
  [
    resolve(contractsRoot, 'src', 'generated', 'schemas.ts'),
    resolve(dstRoot, 'generated', 'schemas.ts'),
  ],
  [
    resolve(contractsRoot, 'src', 'generated', 'manual-schemas.ts'),
    resolve(dstRoot, 'generated', 'manual-schemas.ts'),
  ],
  [
    resolve(contractsRoot, 'src', 'generated', 'index.ts'),
    resolve(dstRoot, 'generated', 'index.ts'),
  ],
  [
    resolve(contractsRoot, 'CONTRACT_VERSION.json'),
    resolve(dstRoot, 'CONTRACT_VERSION.json'),
  ],
];

mkdirSync(resolve(dstRoot, 'generated'), { recursive: true });

for (const [from, to] of files) {
  if (!existsSync(from)) {
    console.error(`[copy-contracts] Origen no existe: ${from}`);
    process.exit(1);
  }
  copyFileSync(from, to);
  console.log(`Copiado ${from}`);
  console.log(`     -> ${to}`);
}

console.log('');
console.log(`[copy-contracts] Sync OK -> ${dstRoot}`);