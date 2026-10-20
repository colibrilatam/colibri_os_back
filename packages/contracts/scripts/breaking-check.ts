import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, isAbsolute } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const contractsRoot = resolve(__dirname, '..');
const backendRoot = resolve(contractsRoot, '..', '..');
const srcDir = resolve(contractsRoot, 'src');
const specPath = resolve(srcDir, 'openapi.json');
const defaultPreviousPath = resolve(srcDir, '.previous-openapi.json');

function parsePreviousPath(): string {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--previous') {
      return resolvePath(args[i + 1] || defaultPreviousPath);
    }
    if (args[i].startsWith('--previous=')) {
      return resolvePath(args[i].split('=')[1] || defaultPreviousPath);
    }
  }
  return defaultPreviousPath;
}

function resolvePath(inputPath: string): string {
  if (isAbsolute(inputPath)) {
    return inputPath;
  }
  return resolve(backendRoot, inputPath);
}

const previousPath = parsePreviousPath();

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
      const oldProp = oldSchemas[name].properties[prop];
      const newProp = newSchemas[name].properties[prop];

      const oldEnum = oldProp.enum;
      const newEnum = newProp.enum;
      if (oldEnum && newEnum) {
        const removed = oldEnum.filter((v: string) => !newEnum.includes(v));
        if (removed.length > 0) {
          breaking.push(`${name}.${prop}: valores de enum eliminados: ${removed.join(', ')}`);
        }
      }

      const oldType = oldProp.type;
      const newType = newProp.type;
      if (oldType && newType && oldType !== newType) {
        breaking.push(`${name}.${prop}: tipo cambiado de '${oldType}' a '${newType}'`);
      }
    }
  }

  const oldPaths = Object.keys(oldSpec?.paths || {});
  const newPaths = Object.keys(newSpec?.paths || {});
  for (const path of oldPaths) {
    if (!newPaths.includes(path)) {
      breaking.push(`Endpoint eliminado: ${path}`);
    } else {
      const oldMethods = Object.keys(oldSpec.paths[path] || {});
      const newMethods = Object.keys(newSpec.paths[path] || {});
      for (const method of oldMethods) {
        if (!newMethods.includes(method)) {
          breaking.push(`Endpoint ${method.toUpperCase()} ${path}: método HTTP eliminado`);
        }
      }
    }
  }

  return breaking;
}

if (!existsSync(previousPath)) {
  console.error(`No se encontró el spec previo en ${previousPath}.`);
  console.error('En CI, generarlo con: git show origin/<base_ref>:packages/contracts/src/openapi.json');
  process.exit(1);
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
