# Levantar el proyecto con Docker Compose

## Archivos añadidos
- `Dockerfile` — build multi-stage (builder con devDependencies + runtime slim con `node:22-alpine`, usuario no-root).
- `.dockerignore` — evita copiar `node_modules`, `.git`, `.env*`, tests, etc. dentro de la imagen.
- `docker-compose.yml` — servicio `db` (Postgres 16) + `app` (la API NestJS) + servicios opcionales `migrate` y `seed`.

## 1. Prepara el `.env`
Usa tu `.env` real en la raíz del proyecto (el mismo que ya tienes, basado en `.env.example`). Docker Compose lo lee automáticamente para:
- Sustituir variables dentro del propio `docker-compose.yml` (`${DB_USERNAME}`, `${DB_PASSWORD}`, etc.).
- Inyectarlo completo dentro del contenedor `app` vía `env_file` (JWT, Google OAuth, Cloudinary, etc.).

⚠️ Dentro de la red de Docker, `DB_HOST` y `DATABASE_URL` se sobrescriben automáticamente en el `docker-compose.yml` para apuntar al contenedor `db` (no a `localhost`). No necesitas tocar eso a mano.

## 2. Levantar la app + base de datos
```bash
docker compose up -d --build
```
- API disponible en: http://localhost:3000/api/v1
- Swagger (si `SWAGGER_ENABLED=true`): http://localhost:3000/docs
- Postgres expuesto en el puerto `5432` del host (por si quieres conectarte con DBeaver/TablePlus).

## 3. Ejecutar migraciones (primera vez o tras cambios de esquema)
```bash
docker compose run --rm migrate
```

## 4. Sembrar datos de ejemplo (opcional)
```bash
docker compose run --rm seed
```

## Otros comandos útiles
```bash
docker compose logs -f app     # ver logs de la API
docker compose down            # parar todo
docker compose down -v         # parar y borrar también el volumen de Postgres (⚠️ borra los datos)
```

## Notas
- `migrate` y `seed` usan la etapa `builder` del Dockerfile (con `ts-node`/devDependencies), porque el TypeORM CLI necesita compilar `data-source.ts` al vuelo. La imagen `app` final es la etapa `runner`, ya con dependencias reducidas para producción.
- `NODE_ENV` se fuerza a `development` en `migrate`/`seed` para que `data-source.ts` no exija SSL contra el Postgres local del compose.
- Si cambias `DB_USERNAME`, `DB_PASSWORD` o `DB_NAME` en el `.env`, vuelve a levantar con `docker compose up -d --build` para que el healthcheck de Postgres use los valores correctos.
