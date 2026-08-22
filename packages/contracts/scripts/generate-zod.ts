import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(__dirname, '..', 'src');
const specPath = resolve(srcDir, 'openapi.json');

if (!existsSync(specPath)) {
  console.error('No se encontro openapi.json. Ejecutar: npm run export-spec');
  process.exit(1);
}

console.log('Los esquemas Zod estan definidos manualmente en src/generated/schemas.ts');
console.log('Para regenerar desde OpenAPI, usar: npx openapi-zod-client');
console.log('Usando esquemas manuales como source of truth.');
