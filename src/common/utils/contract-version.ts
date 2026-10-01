import { readFileSync } from 'fs';
import { resolve } from 'path';

interface ContractVersionFile {
  version: string;
}

let cachedVersion: string | null = null;

/**
 * Lee la versión del contrato desde packages/contracts/CONTRACT_VERSION.json.
 * Cachea el resultado en memoria para lecturas repetidas.
 * Fallback a '1.0.0' si el archivo no existe o es inválido.
 */
export function readContractVersion(): string {
  if (cachedVersion !== null) {
    return cachedVersion;
  }

  const versionPath = resolve(process.cwd(), 'packages', 'contracts', 'CONTRACT_VERSION.json');

  try {
    const raw = readFileSync(versionPath, 'utf-8');
    const parsed = JSON.parse(raw) as ContractVersionFile;
    cachedVersion = parsed.version ?? '1.0.0';
    return cachedVersion;
  } catch {
    cachedVersion = '1.0.0';
    return cachedVersion;
  }
}

/**
 * Resetea el cache (útil para tests).
 */
export function resetContractVersionCache(): void {
  cachedVersion = null;
}
