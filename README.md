# Colibrí OS — Backend

API REST de Colibrí OS, la plataforma que acompaña el recorrido de proyectos, registra su ejecución y evidencias, y produce señales reputacionales y analíticas.

Está construida con NestJS, TypeScript, PostgreSQL y TypeORM. La API se publica bajo el prefijo `/api/v1` y su especificación Swagger puede habilitarse en `/api/v1/docs`.

## Inicio rápido

### Requisitos

- Node.js 22 (la versión usada por CI).
- npm 10 o compatible con el `package-lock.json`.
- PostgreSQL accesible desde el equipo local.

### Configuración local

1. Instalar las dependencias:

   ```powershell
   npm ci
   ```

2. Crear el archivo de entorno y completar los valores locales:

   ```powershell
   Copy-Item .env.example .env
   ```

   Como mínimo, configure una base de datos en `DATABASE_URL`, un `JWT_SECRET` propio y `FRONTEND_URL`. No suba `.env` ni secretos al repositorio.

3. Iniciar la API en modo desarrollo:

   ```powershell
   npm run start:dev
   ```

4. Abrir la documentación interactiva en [http://localhost:3000/api/v1/docs](http://localhost:3000/api/v1/docs), si `SWAGGER_ENABLED=true`.

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `NODE_ENV`, `PORT` | Entorno y puerto de la aplicación (default: `3000`). |
| `DATABASE_URL` | Conexión PostgreSQL para la aplicación, scripts y migraciones. |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | Referencia de conexión local; `DATABASE_URL` es la variable utilizada por TypeORM. |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Firma y vencimiento de los tokens de sesión. |
| `AUTH_COOKIE_MAX_AGE_MS` | Duración de la cookie HttpOnly tras Google OAuth (en milisegundos). |
| `FRONTEND_URL` | Origen permitido por CORS y destino posterior al login con Google. |
| `FRONTEND_URLS` | Lista separada por comas de orígenes CORS permitidos. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | OAuth de Google. Necesarias cuando se habilita ese método de acceso. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Firma, carga y gestión de archivos de evidencia en Cloudinary. |
| `SWAGGER_ENABLED` | Habilita la UI Swagger cuando vale `true`. |
| `BLOCKCHAIN_RPC_URLS` | JSON map de `chainId` → RPC URL (ej: `{"137":"https://polygon-rpc.com"}`). |
| `BLOCKCHAIN_CONFIRMATIONS` | JSON map de `chainId` → confirmaciones requeridas para validación on-chain. |
| `BLOCKCHAIN_DEFAULT_CONFIRMATIONS` | Fallback de confirmaciones cuando una red no está en `BLOCKCHAIN_CONFIRMATIONS`. |

Use valores diferentes por ambiente y cárguelos desde el gestor de secretos de la plataforma de despliegue. Las credenciales de Cloudinary, Google, JWT y PostgreSQL no deben exponerse en tickets, logs ni código cliente.

## Datos locales

Los comandos disponibles para administrar el esquema son:

```powershell
# Crear una migración a partir de cambios de entidades
npm run migration:generate -- src/database/migrations/NombreDescriptivo

# Aplicar las migraciones pendientes
npm run migration:run

# Revertir la última migración aplicada
npm run migration:revert
```

Para cargar datos de demostración:

```powershell
npm run seed
```

> **Atención:** `npm run seed` vacía y vuelve a cargar tablas de negocio. Úselo solo contra una base de datos local o de pruebas autorizada, nunca como paso rutinario de producción.

## Ejecución y verificación

```powershell
# Compilar
npm run build

# Iniciar el artefacto compilado
npm run start:prod

# Pruebas unitarias y de cobertura
npm run test
npm run test:cov

# Pruebas e2e (requieren variables de entorno y PostgreSQL disponibles)
npm run test:e2e
```

## Testing

El backend usa **Jest 30** para pruebas unitarias y **Supertest 7** para pruebas e2e.

| Comando | Descripción |
| --- | --- |
| `npm run test` | Ejecutar todas las pruebas unitarias |
| `npm run test:cov` | Ejecutar pruebas con reporte de cobertura |
| `npm run test:e2e` | Ejecutar pruebas de integración (requiere DB) |

### Contract Testing

El paquete `@colibri/contracts` (en `packages/contracts`) define esquemas Zod compartidos entre backend y frontend para detectar breaking changes en la API.

```powershell
# Exportar spec de la API
npm run contract:export

# Generar esquemas Zod desde la spec
npm run contract:generate

# Detectar breaking changes
npm run contract:check

# Ejecutar tests de contrato
npm run contract:test
```

### Linting

```powershell
npm run lint       # Verificar reglas ESLint
npm run lint:fix   # Auto-corregir errores
```

### Auditoría de seguridad

```powershell
npm run audit:prod  # better-npm-audit contra dependencias de producción
```

## Troubleshooting

| Error | Causa probable | Solución |
| --- | --- | --- |
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL no está corriendo o `DB_PORT` incorrecto. | Verificar que PostgreSQL esté activo y el puerto coincida con `DB_PORT` en `.env`. |
| `password authentication failed` | Credenciales de DB incorrectas. | Verificar `DB_USERNAME`, `DB_PASSWORD` y que el usuario exista en PostgreSQL. |
| `jwt malformed` | Token JWT corrupto o inexistente. | Re-login o verificar que el frontend envíe `Authorization: Bearer <token>`. |
| `CORS error` / `blocked by CORS policy` | Origen no permitido. | Verificar que `FRONTEND_URL` o `FRONTEND_URLS` incluya el origen del frontend. |
| `Google OAuth redirect mismatch` | `GOOGLE_CALLBACK_URL` no coincide con Google Cloud Console. | Verificar que la URL en `.env` coincida con la configurada en Google Cloud Console. |
| `Cloudinary upload failed` | Credenciales de Cloudinary inválidas. | Verificar `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. |
| `Cannot find module` tras `npm ci` | Workspaces no resueltos. | Ejecutar `npm ci` desde la raíz del backend; verificar que `packages/contracts` exista. |
| `TypeORMError: Table ... does not exist` | Migraciones no ejecutadas. | Ejecutar `npm run migration:run` antes de iniciar la app. |
| Puerto 3000 en uso | Otro proceso usa el puerto. | Cambiar `PORT` en `.env` o matar el proceso que bloquea el puerto. |

## Arquitectura, seguridad y operación

- [Arquitectura de Colibrí OS](docs/architecture.md): capas funcionales, módulos, entidades e integraciones.
- [Configuración y variables de entorno](docs/configuration.md): esquema obligatorio de arranque y validación.
- [CI/CD](docs/ci-cd.md): pipeline, gates obligatorios y evidencia técnica generada.
- [Matriz de permisos](docs/security/permissions-matrix.md): acceso efectivo por ruta y rol.
- [Matriz de permisos por actor/recurso/acción (SEC-003)](docs/security/SEC-003-permission-matrix.md): reglas de propiedad y membresía, en revisión.
- [Proceso de excepciones de seguridad](docs/security/exceptions-process.md) y su [log de excepciones](docs/security/exceptions-log.md).
- [Runbook de despliegue](docs/runbooks/deployment.md): preparación, liberación y verificación en Render.
- [Runbook de rollback](docs/runbooks/rollback.md): restauración de una versión anterior y comprobaciones posteriores.
- [Runbook de incidentes](docs/runbooks/incidents.md): respuesta, comunicación y cierre de incidentes.
- [Checklist de onboarding y validación operativa](docs/onboarding-checklist.md): validación end-to-end por una persona no participante.

## Licencia

Este repositorio es privado y no concede permiso de uso, redistribución ni
modificación fuera de lo autorizado por Colibrí Latam. Ver el archivo
[`LICENSE`](LICENSE) en la raíz del repositorio; su condición `UNLICENSED`
es coherente con la declarada en `package.json`.
