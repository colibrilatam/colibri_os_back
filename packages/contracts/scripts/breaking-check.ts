import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(__dirname, '..', 'src');
const specPath = resolve(srcDir, 'openapi.json');
const previousPath = resolve(srcDir, '.previous-openapi.json');

function compareSchemas(oldSpec: any, newSpec: any): string[] {
  const breaking: string[] = [];
  const oldSchemas = oldSpec?.components?.schemas || {};
  const newSchemas = newSpec?.components?.schemas || {};

  for (const name of Object.keys(oldSchemas)) {
    if (!(name in newSchemas)) {
      breaking.push(`Schema eliminado: ${name}`);
    }
  }

  for (const name of Object.keys(oldSchemas)) {
    if (!(name in newSchemas)) continue;
    const oldRequired = oldSchemas[name].required || [];
    const newRequired = newSchemas[name].required || [];

    for (const field of newRequired) {
      if (!oldRequired.includes(field)) {
        breaking.push(`${name}: campo '${field}' ahora es requerido`);
      }
    }

    for (const field of oldRequired) {
      if (!newRequired.includes(field)) {
        breaking.push(`${name}: campo '${field}' ya no es requerido`);
      }
    }

    const oldProps = Object.keys(oldSchemas[name].properties || {});
    const newProps = Object.keys(newSchemas[name].properties || {});
    for (const prop of oldProps) {
      if (!newProps.includes(prop)) {
        breaking.push(`${name}: propiedad '${prop}' eliminada`);
      }
    }

    for (const prop of oldProps) {
      if (!newProps.includes(prop)) continue;
      const oldEnum = oldSchemas[name].properties[prop].enum;
      const newEnum = newSchemas[name].properties[prop].enum;
      if (oldEnum && newEnum) {
        const removed = oldEnum.filter((v: string) => !newEnum.includes(v));
        if (removed.length > 0) {
          breaking.push(`${name}.${prop}: valores de enum eliminados: ${removed.join(', ')}`);
        }
      }
    }
  }

  const oldPaths = Object.keys(oldSpec?.paths || {});
  const newPaths = Object.keys(newSpec?.paths || {});
  for (const path of oldPaths) {
    if (!newPaths.includes(path)) {
      breaking.push(`Endpoint eliminado: ${path}`);
    }
  }

  return breaking;
}

if (!existsSync(previousPath)) {
  console.log('No hay spec anterior. Skipping breaking check.');
  process.exit(0);
}

if (!existsSync(specPath)) {
  console.error('No se encontro openapi.json actual.');
  process.exit(1);
}

const oldSpec = JSON.parse(readFileSync(previousPath, 'utf-8'));
const newSpec = JSON.parse(readFileSync(specPath, 'utf-8'));
const breaking = compareSchemas(oldSpec, newSpec);

if (breaking.length > 0) {
  console.error('\n=== BREAKING CHANGES DETECTADOS ===\n');
  breaking.forEach(b => console.error(`  [BREAKING] ${b}`));
  console.error('\nBump major version en @colibri/contracts antes de merge.\n');
  process.exit(1);
} else {
  console.log('No se detectaron breaking changes.');
  process.exit(0);
}
