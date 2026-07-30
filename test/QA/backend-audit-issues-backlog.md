# Backlog backend auditoria 30-07-2026

Fuente:
- `C:\Dev\ColibriLatam\Dev\QA\Problemas_30-07-2026-para-desarrollo.md`
- `C:\Dev\ColibriLatam\Dev\QA\Colibri_OS_GitHub_Issues_Back_Front.zip`

Estado:
- Pendiente de sincronizar como issues en GitHub.
- Este backlog contiene solo los hallazgos de backend del zip.

## Resumen

| ID | Titulo | Prioridad | Area | Estimacion |
|---|---|---:|---|---:|
| BACK-001 | Crear endpoints publicos `/health` y `/ready` | Release blocker | Backend / DevOps | 1 dia |
| BACK-002 | Capturar y registrar errores fatales de bootstrap | Release blocker | Backend | 0.5 dia |
| DEVOPS-001 | Auditar configuracion y despliegue del backend en Render | Release blocker | Backend / DevOps | 0.5 dia |
| AUTH-001 | Auditar y corregir inconsistencias de usuarios y autenticacion | Release blocker | Backend / Database | 1 dia |
| AUTH-002 | Estabilizar endpoint y sesion de acceso como invitado | Release blocker | Backend / Frontend | 1 dia |
| CI-001 | Implantar CI obligatorio para backend | Release blocker | DevOps / QA / Backend | 1-2 dias |
| CONF-001 | Corregir configuracion CORS para produccion y previews autorizadas | Release blocker | Backend / DevOps | 0.5 dia |

## BACK-001 - Crear endpoints publicos `/health` y `/ready`

- Riesgo: no hay verificacion publica de disponibilidad.
- Alcance: `GET /api/v1/health` y `GET /api/v1/ready` sin autenticacion.
- Criterios:
  - `health` responde `200` con `status`, `service`, `version`, `uptime`, `timestamp`.
  - `ready` consulta PostgreSQL y responde `503` si la base no esta disponible.
  - No se exponen secretos.
- Negativo:
  - Parar PostgreSQL y validar `503` en readiness.

## BACK-002 - Capturar y registrar errores fatales de bootstrap

- Riesgo: fallos de arranque sin diagnostico.
- Alcance: envolver `bootstrap()` con `catch`, log estructurado y `exit(1)`.
- Criterios:
  - El fallo fatal muestra causa raiz.
  - Se registra commit SHA y entorno.
  - No se filtran secretos.
- Negativo:
  - Arrancar sin `DATABASE_URL`.
  - Simular fallo de TypeORM.

## DEVOPS-001 - Auditar configuracion y despliegue del backend en Render

- Riesgo: despliegue inestable por configuracion incompleta.
- Alcance: build, start, root dir, Node version, variables de entorno, health check y auto deploy.
- Criterios:
  - `dist/main.js` se genera correctamente.
  - La app queda estable tras restart.
  - `/health` y `/ready` responden `200`.
- Negativo:
  - Validar que un cambio en config no rompa el arranque.

## AUTH-001 - Auditar y corregir inconsistencias de usuarios y autenticacion

- Riesgo: usuarios existentes no pueden entrar o quedan duplicados logicos.
- Alcance: normalizacion de email, conflicto local vs Google, errores coherentes.
- Criterios:
  - Email con espacios o mayusculas se normaliza.
  - Duplicados devuelven `409`.
  - Credenciales invalidas devuelven `401`.
  - No hay registros parciales.
- Negativo:
  - Doble registro.
  - Conflicto entre cuenta local y Google.

## AUTH-002 - Estabilizar endpoint y sesion de acceso como invitado

- Riesgo: el flujo demo bloquea la validacion funcional.
- Alcance: flujo de invitado idempotente, observable y reutilizable.
- Criterios:
  - El invitado entra sin registro.
  - La sesion demo se crea o reutiliza.
  - El flujo soporta refresh y reset.
- Negativo:
  - Sesion expirada.
  - Entrada repetida consecutiva.

## CI-001 - Implantar CI obligatorio para backend

- Riesgo: el backend entra a `main` sin validacion automatica.
- Alcance: `npm ci`, `npm run build`, lint, unit tests, integration tests, e2e tests, migraciones y smoke check.
- Criterios:
  - El workflow pasa en PR.
  - `main` queda protegido por checks obligatorios.
  - Hay evidencia de logs y artefactos.
- Negativo:
  - Fallo de build o tests bloquea merge.

## CONF-001 - Corregir configuracion CORS para produccion y previews autorizadas

- Riesgo: un solo `FRONTEND_URL` rompe entornos de preview o produccion.
- Alcance: `FRONTEND_URLS` normalizado y validado.
- Criterios:
  - El origen de produccion queda autorizado.
  - Las previews permitidas tambien.
  - `credentials` queda explicitamente habilitado.
  - Origen no autorizado queda bloqueado.
- Negativo:
  - URL mal formada.
  - Origen no autorizado.
