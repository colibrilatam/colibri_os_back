# Runbook: Regeneración del entorno demo

**Objetivo:** regenerar los datos del entorno demo de forma segura y repetible.
**Frecuencia:** semanal (cron) o a demanda.
**Riesgo:** bajo — el entorno demo usa una base de datos separada.

## Precondiciones

- Docker y Docker Compose instalados.
- `colibri_os_back/.env.demo` creado desde `.env.demo.example`.
- `JWT_SECRET` definido en `.env.demo` (generar con `openssl rand -hex 32`).

## Procedimiento

### 1. Levantar la base demo

```bash
cd colibri_os_back
docker compose -f docker-compose.demo.yml up -d db-demo
```

Esperar a que el healthcheck pase:

```bash
docker compose -f docker-compose.demo.yml ps
```

### 2. Ejecutar migraciones

```bash
docker compose -f docker-compose.demo.yml run --rm migrate-demo
```

### 3. Regenerar datos (destructivo)

```bash
CONFIRM_DESTRUCTIVE_SEED=yes-destroy-data \
  docker compose -f docker-compose.demo.yml run --rm seed-demo
```

**Qué hace:**
- Verifica `NODE_ENV !== 'production'` (aborta si es production).
- Verifica que el host de `DATABASE_URL` está en la allowlist (aborta si no).
- Verifica `CONFIRM_DESTRUCTIVE_SEED=yes-destroy-data` (aborta si falta).
- Ejecuta `TRUNCATE ... CASCADE` sobre las 18 tablas.
- Siembra usuarios demo con `role=demo_readonly` y hashes bcrypt únicos.
- Siembra proyectos, tramos, categorías, PACs, evidencias, NFTs, etc.

**Qué NO hace:**
- No imprime passwords a stdout. Las cuentas se acceden vía `POST /auth/demo-login`.
- No toca la base de producción (guard de host + guard de NODE_ENV).

### 4. Verificar

```bash
# Login demo funciona
curl -X POST http://localhost:3032/api/v1/auth/demo-login \
  -H "Content-Type: application/json" \
  -d '{"role":"entrepreneur"}' | jq

# Escritura bloqueada (debe devolver 403)
TOKEN=$(curl -s -X POST http://localhost:3032/api/v1/auth/demo-login \
  -H "Content-Type: application/json" \
  -d '{"role":"entrepreneur"}' | jq -r .token)

curl -X POST http://localhost:3032/api/v1/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectName":"No debo poder"}' | jq
```

### 5. Rotación implícita

Al regenerar, las passwords de las cuentas demo cambian (nuevos hashes con
salt único). Las sesiones demo anteriores siguen siendo válidas hasta que
expire el JWT (7 días) o hasta que se cierre sesión.

Si se necesita invalidar inmediatamente todas las sesiones demo: cambiar
`JWT_SECRET` en `.env.demo` y reiniciar `app-demo`.

## Troubleshooting

| Sintoma | Causa | Solución |
| --- | --- | --- |
| `Seed abortado: NODE_ENV=production` | `NODE_ENV` es production | Verificar `.env.demo` |
| `Seed abortado: el host "X" no está en la lista` | `DATABASE_URL` apunta a host no permitido | Añadir host a `SEED_ALLOWED_HOSTS` |
| `Seed abortado: falta confirmación explícita` | Falta `CONFIRM_DESTRUCTIVE_SEED` | Añadir la variable al comando |
| `login demo falla: Entorno demo no disponible` | Cuentas no sembradas o rol incorrecto | Re-ejecutar seed |
| `403 en escritura` (esperado) | `DemoReadOnlyGuard` activo | ✅ Comportamiento correcto |
