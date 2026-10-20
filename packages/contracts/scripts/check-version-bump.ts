import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, isAbsolute } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface VersionInfo {
  version: string;
}

function parseArgs(): { oldPath: string; newPath: string; breaking: boolean } {
  const args = process.argv.slice(2);
  let oldPath = '';
  let newPath = '';
  let breaking: boolean | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--old') {
      oldPath = args[i + 1] || '';
    } else if (args[i].startsWith('--old=')) {
      oldPath = args[i].split('=')[1] || '';
    } else if (args[i] === '--new') {
      newPath = args[i + 1] || '';
    } else if (args[i].startsWith('--new=')) {
      newPath = args[i].split('=')[1] || '';
    } else if (args[i] === '--breaking') {
      breaking = args[i + 1] === 'true';
    } else if (args[i].startsWith('--breaking=')) {
      breaking = args[i].split('=')[1] === 'true';
    }
  }

  if (!oldPath || !newPath) {
    console.error('Uso: check-version-bump --old=<ruta> --new=<ruta> [--breaking=true|false]');
    console.error('  --old: path al CONTRACT_VERSION.json anterior');
    console.error('  --new: path al CONTRACT_VERSION.json nuevo');
    console.error('  --breaking: si hubo breaking changes (true/false). También se lee de env BREAKING.');
    process.exit(1);
  }

  if (breaking === null) {
    breaking = process.env.BREAKING === 'true';
  }

  return { oldPath, newPath, breaking: breaking ?? false };
}

function parseSemVer(version: string): { major: number; minor: number; patch: number } {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    throw new Error(`Versión inválida (esperado SemVer MAJOR.MINOR.PATCH): ${version}`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

function resolvePath(inputPath: string): string {
  if (isAbsolute(inputPath)) {
    return inputPath;
  }
  return resolve(__dirname, '..', '..', '..', inputPath);
}

function readVersionFile(path: string): VersionInfo {
  const resolvedPath = resolvePath(path);
  if (!existsSync(resolvedPath)) {
    throw new Error(`Archivo no encontrado: ${resolvedPath}`);
  }
  const content = readFileSync(resolvedPath, 'utf-8');
  const parsed = JSON.parse(content) as VersionInfo;
  if (!parsed.version) {
    throw new Error(`El archivo ${resolvedPath} no tiene campo "version"`);
  }
  return parsed;
}

function main(): void {
  const { oldPath, newPath, breaking } = parseArgs();

  const oldVersionInfo = readVersionFile(oldPath);
  const newVersionInfo = readVersionFile(newPath);

  const oldVer = parseSemVer(oldVersionInfo.version);
  const newVer = parseSemVer(newVersionInfo.version);

  if (!breaking) {
    console.log('No hay breaking changes. Check de versión omitido.');
    process.exit(0);
  }

  if (newVer.major > oldVer.major) {
    console.log(`MAJOR bumped: ${oldVer.major} -> ${newVer.major}. OK.`);
    process.exit(0);
  }

  const expectedMajor = oldVer.major + 1;
  console.error(
    `Breaking changes detectados pero CONTRACT_VERSION.json no subió el MAJOR.`
  );
  console.error(`Actual: ${oldVersionInfo.version} -> Nuevo: ${newVersionInfo.version}.`);
  console.error(`Se esperaba al menos ${expectedMajor}.0.0.`);
  process.exit(1);
}

main();