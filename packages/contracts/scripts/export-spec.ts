import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(__dirname, '..', 'src');

const specPath = resolve(srcDir, 'openapi.json');
const backupPath = resolve(srcDir, '.previous-openapi.json');

if (existsSync(specPath)) {
  const current = readFileSync(specPath, 'utf-8');
  writeFileSync(backupPath, current);
  console.log('Backup del spec anterior creado.');
}

await import('./write-openapi.mjs');
console.log('OpenAPI spec exportado correctamente.');
