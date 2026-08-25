#!/usr/bin/env node
/**
 * QA-001 — Auditoría de cobertura de pruebas negativas por endpoint crítico.
 *
 * "Endpoint crítico" = cualquier ruta de un controller que declare
 * JwtAuthGuard (con o sin RolesGuard), a nivel de clase o de método.
 *
 * El script:
 *   1. Escanea src/** /*.controller.ts y extrae (método HTTP, ruta, guards).
 *   2. Escanea test/** /*.e2e-spec.ts buscando, para cada endpoint crítico,
 *      al menos una llamada con ese método + segmento de ruta seguida
 *      (dentro de una ventana de líneas) de `.expect(401)` o `.expect(403)`.
 *   3. Compara el resultado contra un baseline (scripts/negative-tests-baseline.json).
 *      - Si aparecen endpoints NUEVOS sin prueba negativa → falla (bloquea el merge).
 *      - Si un endpoint que SÍ tenía cobertura la pierde → falla (regresión).
 *      - Endpoints ya conocidos sin cobertura (heredados) no rompen el build,
 *        pero quedan listados como deuda pendiente.
 *
 * Es un análisis estático heurístico (no ejecuta la app), pensado como red
 * de seguridad barata en CI, no como reemplazo de las suites e2e reales.
 *
 * Uso:
 *   node scripts/audit-negative-tests.mjs            # audita y compara con baseline
 *   node scripts/audit-negative-tests.mjs --update    # regenera el baseline (uso manual, revisar en PR)
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BASELINE_PATH = join(__dirname, 'negative-tests-baseline.json');

const HTTP_DECORATORS = ['Get', 'Post', 'Patch', 'Put', 'Delete'];
const AUTH_GUARDS = ['JwtAuthGuard'];

/** Lista archivos recursivamente sin depender de glob no soportado en algunas versiones de Node. */
function walk(dir, matcher, acc = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, matcher, acc);
    else if (matcher(full)) acc.push(full);
  }
  return acc;
}

function extractControllerEndpoints(filePath) {
  const src = readFileSync(filePath, 'utf8');
  const lines = src.split(/\r?\n/);

  const controllerMatch = src.match(/@Controller\(\s*(['"`])([^'"`]*)\1\s*\)/);
  const basePath = controllerMatch ? controllerMatch[2] : '';

  // Guards a nivel de clase: cualquier @UseGuards(...) entre @Controller y `export class`.
  const classStart = src.indexOf('@Controller');
  const classDeclIdx = src.indexOf('export class', classStart);
  const classHeader = classDeclIdx > -1 ? src.slice(classStart, classDeclIdx) : '';
  const classGuards = [...classHeader.matchAll(/@UseGuards\(([^)]*)\)/g)].flatMap((m) =>
    m[1].split(',').map((g) => g.trim()),
  );

  const endpoints = [];
  let pendingGuards = [];
  let pendingRoles = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const guardMatch = line.match(/@UseGuards\(([^)]*)\)/);
    if (guardMatch) {
      pendingGuards.push(...guardMatch[1].split(',').map((g) => g.trim()));
      continue;
    }
    const rolesMatch = line.match(/@Roles\(([^)]*)\)/);
    if (rolesMatch) {
      pendingRoles.push(...rolesMatch[1].split(',').map((r) => r.trim()));
      continue;
    }

    const httpMatch = line.match(new RegExp(`@(${HTTP_DECORATORS.join('|')})\\(\\s*(?:(['"\`])([^'"\`]*)\\2)?\\s*\\)`));
    if (httpMatch) {
      const method = httpMatch[1].toUpperCase();
      const subPath = httpMatch[3] ?? '';
      const guards = [...new Set([...classGuards, ...pendingGuards])];
      const isCritical = guards.some((g) => AUTH_GUARDS.includes(g));

      const fullPath = ['', 'api', 'v1', basePath, subPath]
        .join('/')
        .replace(/\/+/g, '/')
        .replace(/\/$/, '');

      endpoints.push({
        method,
        path: fullPath || '/',
        guards,
        roles: [...new Set(pendingRoles)],
        critical: isCritical,
        file: filePath.replace(ROOT + '/', '').replace(/\\/g, '/'),
      });

      pendingGuards = [];
      pendingRoles = [];
    }
  }

  return endpoints;
}

/** Convierte /api/v1/projects/:id en segmentos útiles para búsqueda difusa en los tests. */
function routeSignature(endpoint) {
  const segments = endpoint.path.split('/').filter(Boolean).filter((s) => !s.startsWith(':'));
  return segments;
}

function hasNegativeTestCoverage(endpoint, testCorpus) {
  const method = endpoint.method.toLowerCase();
  const segments = routeSignature(endpoint);
  if (segments.length === 0) return false;

  // Heurística: buscar `.method(` seguido, en las próximas ~20 líneas, de un
  // path que contenga los mismos segmentos literales y de un `.expect(401|403)`.
  const methodCallRegex = new RegExp(`\\.${method}\\(`, 'g');

  for (const { content, lines } of testCorpus) {
    let match;
    while ((match = methodCallRegex.exec(content)) !== null) {
      const startLineIdx = content.slice(0, match.index).split('\n').length - 1;
      const window = lines.slice(startLineIdx, startLineIdx + 20).join('\n');

      const pathLine = lines.slice(startLineIdx, startLineIdx + 3).join('\n');
      const containsRoute = segments.every((seg) => pathLine.includes(seg));
      const hasNegativeExpect = /\.expect\(\s*(401|403)\s*\)/.test(window);

      if (containsRoute && hasNegativeExpect) return true;
    }
  }
  return false;
}

function loadTestCorpus() {
  const files = walk(join(ROOT, 'test'), (f) => f.endsWith('.e2e-spec.ts'));
  return files.map((f) => {
    const content = readFileSync(f, 'utf8');
    return { file: f, content, lines: content.split(/\r?\n/) };
  });
}

function loadControllerEndpoints() {
  const files = walk(join(ROOT, 'src'), (f) => f.endsWith('.controller.ts'));
  return files.flatMap(extractControllerEndpoints);
}

function loadBaseline() {
  if (!existsSync(BASELINE_PATH)) return { uncovered: [] };
  return JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
}

function endpointKey(e) {
  return `${e.method} ${e.path}`;
}

function main() {
  const update = process.argv.includes('--update');

  const endpoints = loadControllerEndpoints().filter((e) => e.critical);
  const testCorpus = loadTestCorpus();

  const results = endpoints.map((e) => ({
    key: endpointKey(e),
    file: e.file,
    covered: hasNegativeTestCoverage(e, testCorpus),
  }));

  const uncovered = results.filter((r) => !r.covered).map((r) => r.key).sort();
  const covered = results.filter((r) => r.covered).map((r) => r.key).sort();

  console.log(`QA-001 — Endpoints críticos encontrados: ${results.length}`);
  console.log(`  Con al menos 1 prueba negativa (401/403 detectada): ${covered.length}`);
  console.log(`  Sin prueba negativa detectada: ${uncovered.length}`);

  if (update) {
    writeFileSync(
      BASELINE_PATH,
      JSON.stringify({ generatedAt: new Date().toISOString(), uncovered }, null, 2) + '\n',
    );
    console.log(`\nBaseline actualizado en ${BASELINE_PATH}. Revisar el diff en el PR.`);
    return;
  }

  const baseline = loadBaseline();
  const baselineSet = new Set(baseline.uncovered ?? []);
  const uncoveredSet = new Set(uncovered);

  const newlyUncovered = uncovered.filter((k) => !baselineSet.has(k));
  const stillPending = uncovered.filter((k) => baselineSet.has(k));

  if (stillPending.length > 0) {
    console.log('\nDeuda conocida (no bloquea, ya estaba en el baseline):');
    stillPending.forEach((k) => console.log(`  - ${k}`));
  }

  if (newlyUncovered.length > 0) {
    console.error('\nERROR (QA-001): endpoints críticos NUEVOS sin prueba negativa (401/403):');
    newlyUncovered.forEach((k) => console.error(`  - ${k}`));
    console.error(
      '\nAgregá al menos una prueba negativa (sin auth, rol incorrecto, recurso ajeno, ' +
        'organización/proyecto incorrecto o estado inválido) que llame a este endpoint y ' +
        'verifique .expect(401) o .expect(403), o corré `node scripts/audit-negative-tests.mjs --update` ' +
        'si el gap es una deuda ya conocida que se está trackeando aparte.',
    );
    process.exitCode = 1;
    return;
  }

  const regressions = (baseline.uncovered ?? []).filter(
    (k) => !uncoveredSet.has(k) && !results.some((r) => r.key === k),
  );
  // Nota: si un endpoint desapareció del código (renombrado/eliminado) no es una regresión de test,
  // así que solo avisamos, no fallamos por eso.
  if (regressions.length > 0) {
    console.log('\nEndpoints que ya no existen en el código (limpiar del baseline si aplica):');
    regressions.forEach((k) => console.log(`  - ${k}`));
  }

  console.log('\nOK: no hay endpoints críticos nuevos sin prueba negativa.');
}

main();