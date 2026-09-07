# CI/CD — pipeline y gates obligatorios

## Objetivo

Ningún cambio llega a `main` (y por lo tanto a producción) sin pasar por
build, lint, tests, escaneo de seguridad y un smoke test de arranque real.

## Workflows (`.github/workflows/`)

| Workflow | Dispara con | Qué hace |
| --- | --- | --- |
| `main.yml` (**Backend CI**) | PR y push a `main` | `npm ci`, lint sin autofix, build, `audit:prod`, tests unitarios (con cobertura), tests e2e contra Postgres real (incluye migración + rollback de migración + smoke test de `/api/v1/health` y `/api/v1/ready`), empaquetado de artefacto de release reproducible. Expone el check **CI Gate**, que agrega el resultado de todos los jobs requeridos. |
| `sca.yml` | PR y push a `main` | `npm audit` (bloquea alto/crítico), OSV-Scanner, Dependency Review en PRs. |
| `codeql.yml` | PR, push a `main`, semanal | Análisis estático (SAST) de JS/TypeScript. |
| `secret-scanning.yml` | PR y push a `main` | Gitleaks — bloquea el merge si detecta un secreto en el diff. |
| `deploy.yml` (**Deploy Backend**) | Al finalizar **Backend CI** con éxito en `main` | Dispara el deploy hook de Render. |
| `ci-negative-tests.yml`, `ci-negative-tests-security.yml` | Cambios en los workflows de CI | **Pruebas negativas del propio CI**: inyectan a propósito un test roto, un lint roto, una migración inválida, una regresión de autorización, un secreto de prueba y una dependencia vulnerable, y verifican que cada gate efectivamente bloquee. Si alguno "pasara" con el defecto inyectado, el workflow falla (el gate no está funcionando). |
| `sync-doc-issues.yml` | Cambios en `doc-issues/**` | Sincroniza los archivos de `doc-issues/` con issues de GitHub (`scripts/sync-doc-issues.mjs`). |

## Qué debe estar configurado como *branch protection* en `main`

- Check requerido: **CI Gate** (de `main.yml`).
- Checks requeridos adicionales recomendados: gates de `sca.yml`,
  `codeql.yml` y `secret-scanning.yml` (SCA/SAST/secret scanning), si el
  plan de GitHub del repositorio lo permite.
- Esto es configuración manual en GitHub (Settings → Branches), no vive en
  código; quien administre el repositorio debe verificarlo tras cualquier
  cambio de workflow.

## Evidencia técnica generada automáticamente

- Cobertura de tests unitarios: artifact `unit-coverage-<sha>`.
- Reporte de `npm audit`: artifact `sca-npm-audit-report-<sha>`.
- Reporte de OSV-Scanner (SARIF, subido también a Code Scanning): artifact `sca-osv-scanner-report-<sha>`.
- Artefacto de release reproducible y su checksum: artifact `release-<sha>`.

Estos artefactos son la "evidencia técnica adjunta" que pide la Definition
of Done de los tickets de este repositorio: enlazarlos desde el ticket de
liberación en lugar de adjuntar capturas manuales.

## Relación con otros documentos

- [Runbook de despliegue](runbooks/deployment.md): qué pasa después de que **Deploy Backend** dispara el hook de Render.
- [Configuración](configuration.md): variables que el job `e2e-tests` carga como dummies para poder correr sin secretos reales.