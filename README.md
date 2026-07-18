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
| `NODE_ENV`, `PORT` | Entorno y puerto de la aplicación. |
| `DATABASE_URL` | Conexión PostgreSQL para la aplicación, scripts y migraciones. |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | Referencia de conexión local; `DATABASE_URL` es la variable utilizada por TypeORM. |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Firma y vencimiento de los tokens de sesión. |
| `FRONTEND_URL` | Origen permitido por CORS y destino posterior al login con Google. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | OAuth de Google. Necesarias cuando se habilita ese método de acceso. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Firma, carga y gestión de archivos de evidencia en Cloudinary. |
| `SWAGGER_ENABLED` | Habilita la UI Swagger cuando vale `true`. |

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

## Arquitectura, seguridad y operación

- [Arquitectura de Colibrí OS](docs/architecture.md): capas funcionales, módulos, entidades e integraciones.
- [Matriz de permisos](docs/security/permissions-matrix.md): acceso efectivo por ruta y rol.
- [Runbook de despliegue](docs/runbooks/deployment.md): preparación, liberación y verificación en Render.
- [Runbook de rollback](docs/runbooks/rollback.md): restauración de una versión anterior y comprobaciones posteriores.
- [Runbook de incidentes](docs/runbooks/incidents.md): respuesta, comunicación y cierre de incidentes.

## Licencia

Este repositorio es privado y no concede permiso de uso, redistribución ni modificación fuera de lo autorizado por Colibrí Latam. Su condición es `UNLICENSED`, coherente con `package.json`.
