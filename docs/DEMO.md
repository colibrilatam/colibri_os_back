# Entorno Demo

## Descripción

El entorno demo permite probar la plataforma con datos de ejemplo sin riesgo
para producción. Todas las cuentas demo usan el rol `demo_readonly`, que solo
permite operaciones GET.

## Cómo se impone la restricción

**La restricción es de servidor, no de UI.** `DemoReadOnlyGuard` está
registrado como `APP_GUARD` global (`src/app.module.ts`). Si el request no es
GET y el usuario tiene `role=demo_readonly`, el guard devuelve **403
Forbidden**. Las excepciones son `POST /auth/logout` y `POST /auth/refresh`
(para que el demo pueda cerrar sesión y renovar token).

El frontend añade un `DemoGuard` de UI que oculta botones de escritura, pero
esto es **UX, no seguridad**. Un atacante puede llamar a la API directamente;
el 403 del backend lo detiene.

## Cuentas demo

| Email | Perfil (datos) | Rol real en DB |
| --- | --- | --- |
| `ana@colibri.com` | Emprendedor | `demo_readonly` |
| `lucas@colibri.com` | Emprendedor | `demo_readonly` |
| `martin@colibri.com` | Emprendedor | `demo_readonly` |
| `sofia@colibri.com` | Emprendedor | `demo_readonly` |
| `mecenas@colibri.com` | Mecenas | `demo_readonly` |
| `BancoDV@colibri.com` | Mecenas | `demo_readonly` |
| `mentor@colibri.com` | Mentor | `demo_readonly` |
| `evaluator@colibri.com` | Evaluador | `demo_readonly` |

El "perfil" es solo un nombre para los datos sembrados (proyectos, NFTs,
evidencias). El rol real de todas las cuentas es `demo_readonly`.

## Autenticación demo

### `POST /api/v1/auth/demo-login`

No requiere contraseña. El body acepta un selector de persona:

```json
{ "role": "entrepreneur" }   // opcional, default: entrepreneur
```

Valores: `entrepreneur`, `mentor`, `evaluator`, `mecenas_semilla`.

La respuesta es idéntica a `signin` (`{ message, user }`) y setea la cookie
`colibri_access_token` (HttpOnly). El token emitido lleva `role=demo_readonly`
en el payload — el rol elegido solo determina qué cuenta demo se usa.

**Throttle:** 10 req/min por IP.

### Por qué no hay password

Las cuentas demo se siembran con hashes bcrypt únicos por cuenta (salt
distinto). La password no está en el código ni en el bundle del cliente. Si
alguien necesita signin manual, debe definir `SEED_USERS_PASSWORD` antes del
seed.

## Generación de credenciales

```bash
cd colibri_os_back
cp .env.demo.example .env.demo
# Completar JWT_SECRET (openssl rand -hex 32)
docker compose -f docker-compose.demo.yml up -d
docker compose -f docker-compose.demo.yml run --rm migrate
CONFIRM_DESTRUCTIVE_SEED=yes-destroy-data \
  docker compose -f docker-compose.demo.yml run --rm seed
```

## Regeneración periódica

Ver `docs/runbooks/demo-refresh.md`.

## Aislamiento de datos

- El entorno demo usa una base de datos **separada** (`docker-compose.demo.yml`),
  con Postgres local en el contenedor `db-demo` (puerto 5433).
- El seed solo puede correr contra hosts en la allowlist
  (`SEED_ALLOWED_HOSTS` o localhost). Si el host no está permitido, el seed
  **aborta** antes del TRUNCATE.
- El seed nunca corre con `NODE_ENV=production`.
