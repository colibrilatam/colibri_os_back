# Paquete de Contratos (`@colibri/contracts`)

## Flujo de contratos

```
NestJS (DTOs + @ApiProperty)
    ↓ npm run contract:export
packages/contracts/src/openapi.json
    ↓ npm run generate-zod (openapi-zod)
packages/contracts/src/generated/schemas.ts
    ↓ npm run copy-contracts
colibri_os_front/client/src/lib/contracts/generated/schemas.ts
    ↓ Frontend: validateResponse(schema, data)
Validación de runtime en cada respuesta
```

## Detección de breaking changes — Receta de simulación y verificación

El workflow `contracts.yml` (GitHub Actions) compara el `openapi.json` generado en el PR contra el de la rama base (`main`). Si detecta cambios rompientes (campos eliminados, tipos cambiados, enums reducidos, campos requeridos agregados), **falla el build** y exige un bump de `MAJOR` en `CONTRACT_VERSION.json`.

### Cómo simular un breaking change localmente

1. **Modificá un DTO** para hacerlo breaking. Ejemplo: en `src/users/dtos/change-user-role.dto.ts`, cambiá `reason` de requerido a opcional:
   ```ts
   // ANTES (requerido)
   @ApiProperty({ description: 'Motivo...' })
   @IsString()
   @IsNotEmpty()
   @MaxLength(500)
   reason: string;

   // DESPUÉS (opcional — breaking para consumidores que esperan que siempre venga)
   @ApiProperty({ description: 'Motivo...', required: false })
   @IsString()
   @IsOptional()
   @MaxLength(500)
   reason?: string;
   ```
   **Nota:** Usá `@ApiProperty({ required: false })` + `@IsOptional()` en lugar de quitar `@IsNotEmpty()`. Quitar el decorador sin más no genera el cambio en OpenAPI; `@ApiProperty({ required: false })` sí lo hace.

2. **Generá el contrato actualizado**:
   ```bash
   npm run contract:generate
   ```

3. **Verificá que el gate lo detecta**:
   ```bash
   npm run contract:check
   # Debería fallar con: "Breaking changes detected"
   ```

4. **Bump de versión obligatorio**:
   - Editá `packages/contracts/CONTRACT_VERSION.json` subiendo el MAJOR (ej: `1.0.0` → `2.0.0`)
   - El script `check-version-bump` valida que el MAJOR subió:
     ```bash
     npm run check-version-bump -w packages/contracts -- --old=packages/contracts/CONTRACT_VERSION.json.old --new=packages/contracts/CONTRACT_VERSION.json --breaking=true
     ```

### Cómo funciona `contracts.yml`

| Paso | Qué hace |
|------|----------|
| **Trigger** | `pull_request` a `main` (paths: `src/**/*.ts`, `packages/contracts/**`) |
| **Baseline** | Hace checkout de `main`, corre `npm run contract:export` → `openapi.base.json` |
| **PR build** | Corre `npm run contract:export` en el PR → `openapi.pr.json` |
| **Diff** | Usa `openapi-diff` con configuración estricta (`breaking-only`, `ignore-additional-properties: false`) |
| **Fail si breaking** | Si hay cambios rompientes, falla y muestra el diff |
| **Version bump** | Ejecuta `check-version-bump` exigiendo `MAJOR + 1` en `CONTRACT_VERSION.json` |
| **Drift check** | Verifica que `openapi.json` commiteado coincida con el generado (evita commits sin regenerar) |

### Comandos locales útiles

```bash
# Genera openapi.json + schemas Zod + copia al frontend (si COLIBRI_FRONTEND_ROOT está seteado)
npm run contract:sync

# Solo genera openapi.json desde NestJS (build + export-spec)
npm run contract:export

# Solo genera schemas Zod desde openapi.json
npm run generate-zod -w packages/contracts

# Solo copia al frontend
npm run copy-contracts -w packages/contracts

# Verifica breaking changes contra rama base (simula lo que hace el CI)
npm run contract:check

# Valida bump de versión manualmente
npm run check-version-bump -w packages/contracts -- --old=packages/contracts/CONTRACT_VERSION.json.old --new=packages/contracts/CONTRACT_VERSION.json --breaking=true
```

## Archivos del paquete

| Archivo | Descripción |
|---------|-------------|
| `CONTRACT_VERSION.json` | Versión SemVer + changelog + fecha último breaking. **Commiteado**. |
| `src/openapi.json` | Spec OpenAPI 3.1 generada desde NestJS. **Commiteado**. |
| `src/generated/schemas.ts` | Esquemas Zod v4 generados desde OpenAPI. **Generado, no editar a mano**. |
| `src/generated/manual-schemas.ts` | Esquemas Zod manuales (enums, tipos complejos). **Editado a mano**. |
| `src/generated/index.ts` | Re-exporta todo lo público. |
| `src/validate.ts` | `validateResponse()`, `createContractGuard()` para frontend. |
| `scripts/generate-zod.ts` | openapi-zod → Zod v4. |
| `scripts/copy-contracts.ts` | Copia `schemas.ts`, `manual-schemas.ts`, `index.ts`, `CONTRACT_VERSION.json` al frontend. |
| `scripts/breaking-check.ts` | openapi-diff contra rama base. |
| `scripts/check-version-bump.ts` | Valida que MAJOR subió si `--breaking=true`. |