# Informe técnico: despliegue con Docker Compose y resolución de conexión a base de datos

**Proyecto:** `colibri_os_back` (NestJS 11 + TypeORM + PostgreSQL)
**Plataforma de despliegue:** Dokploy sobre VPS Hostinger (Ubuntu, Docker)
**Fecha:** 9 de septiembre de 2026

---

## 1. Contexto inicial

El repositorio no incluía artefactos de containerización (`Dockerfile`, `docker-compose.yml`, `.dockerignore`). Se partió de:

- `package.json` — NestJS 11, TypeORM 0.3.x, driver `pg`, scripts `build`/`start:prod`/`migration:run`/`seed`.
- `src/main.ts` — prefijo global `api/v1`, CORS validado contra `FRONTEND_URL`/`FRONTEND_URLS`, Swagger condicional a `SWAGGER_ENABLED`.
- `src/app.module.ts` — `TypeOrmModule.forRootAsync` que **solo lee `DATABASE_URL`** (no arma la conexión desde `DB_HOST`/`DB_PORT`/`DB_USERNAME`/`DB_PASSWORD` por separado).
- `src/database/data-source.ts` — mismo patrón (`url: process.env.DATABASE_URL`), usado por el CLI de TypeORM (`migration:run`) y por el script de `seed`.

Este último punto (una única variable `DATABASE_URL` como fuente de verdad) condicionó todas las decisiones posteriores.

---

## 2. Artefactos creados

### 2.1 `Dockerfile` — build multi-stage

```
builder (node:22-alpine)
  → npm ci
  → npm run build (nest build)
  → npm prune --omit=dev
runner (node:22-alpine)
  → usuario no-root (nestjs:nodejs)
  → copia dist/, node_modules/ (ya podados) y package.json
  → CMD node dist/main
```

Motivo del multi-stage: la imagen final de producción no necesita `ts-node`, `@nestjs/cli` ni el resto de `devDependencies` — solo el JS compilado. Esto reduce superficie y tamaño de imagen.

### 2.2 `.dockerignore`

Excluye `node_modules`, `dist`, `.git`, `.env*`, `test/`, artefactos de skill-testing, etc., para evitar filtrar secretos o inflar el contexto de build.

### 2.3 `docker-compose.yml`

Servicios:
- `db` — `postgres:16-alpine`, con healthcheck (`pg_isready`) y volumen nombrado `pgdata`.
- `app` — build del `Dockerfile`, expone `${PORT}`, depende de `db` con `condition: service_healthy`.
- `migrate` / `seed` — mismos servicios pero apuntando al stage `builder` (necesitan `ts-node` para compilar `data-source.ts` al vuelo), bajo `profiles: ["tools"]` para no arrancar con `docker compose up` normal.

---

## 3. Incidentes encontrados y resolución

### 3.1 Conflicto de nombre de contenedor

**Síntoma:**
```
Error response from daemon: Conflict. The container name "/colibri-back" is already in use...
```

**Causa:** se habían fijado `container_name: colibri-back` / `colibri-db` explícitos. En un entorno de despliegue continuo (Dokploy), cada redeploy intenta recrear el contenedor con ese nombre exacto; si el anterior no se limpió, colisiona.

**Fix:** se eliminaron los `container_name` fijos. Docker Compose nombra los contenedores automáticamente con el prefijo de proyecto que ya pasa Dokploy (`-p colibri-latam-backend-r4hlpv`), evitando colisiones entre despliegues.

### 3.2 `TypeError: Invalid URL` al construir `DATABASE_URL`

**Síntoma:**
```
TypeError: Invalid URL
  at parse (pg-connection-string/index.js)
  ...
input: '*****REDACTED*****'
base: 'postgres://base'
```

**Causa:** el `docker-compose.yml` armaba `DATABASE_URL` por interpolación de variables sueltas:
```yaml
DATABASE_URL: postgresql://${DB_USERNAME}:${DB_PASSWORD}@db:5432/${DB_NAME}
```
Si `DB_PASSWORD` contiene caracteres reservados de URL (`@ : / # % $`) sin escapar/url-encodear, el string resultante deja de ser una URL válida para `pg-connection-string` (que internamente usa el parser `WHATWG URL`).

**Fix:** se eliminó la construcción de `DATABASE_URL` por interpolación en el compose. Pasó a ser **una única variable, completa y ya bien formada**, definida directamente en las variables de entorno de Dokploy (o en el `.env` local), consistente con el hecho de que el código solo lee esa variable.

### 3.3 `ENETUNREACH` — IPv6 sin ruta de salida

**Síntoma:**
```
Error: connect ENETUNREACH 2600:1f16:xxxx:xxxx:...:5432 - Local (:::0)
```

**Diagnóstico:**
1. Una vez corregida la URL, TypeORM sí conectaba al parser, pero fallaba al conectar el socket TCP.
2. La dirección de destino era **IPv6** (`2600:1f16:...`, rango AWS) — el host de base de datos externo (proveedor gestionado tipo RDS) es dual-stack o resuelve por defecto a AAAA.
3. Se probó forzar orden de resolución IPv4-first vía `NODE_OPTIONS=--dns-result-order=ipv4first` en el servicio `app`. **No fue suficiente**: el error persistió con la misma dirección, lo que indica que el host no ofrece registro A (IPv4) alcanzable, o que la única ruta viable para ese hostname es IPv6.
4. Se verificó conectividad IPv6 real del VPS:
   ```bash
   curl -6 -m 5 https://ifconfig.co
   # → 2a02:4780:xx:xxx::1   (el host SÍ tiene salida IPv6)
   ```

**Causa raíz confirmada:** el VPS tenía salida IPv6 a nivel de sistema operativo, pero **Docker no expone IPv6 a los contenedores por defecto** (ni al bridge por defecto ni a redes definidas por el usuario), así que el contenedor `app` no tenía ruta hacia la IPv6 de la base de datos aunque el host sí pudiera alcanzarla.

**Fix aplicado (dos partes):**

**a) Daemon de Docker** (`/etc/docker/daemon.json` en el VPS — se verificó primero si existía config previa de Dokploy antes de sobrescribir):
```json
{
  "ipv6": true,
  "fixed-cidr-v6": "fd00:dead:beef::/48",
  "ip6tables": true
}
```
seguido de `systemctl restart docker`. `ip6tables: true` es lo que habilita el NAT66 (enmascaramiento de las IPs ULA internas de los contenedores hacia la IPv6 pública del host), equivalente a lo que Docker ya hace de forma nativa para IPv4.

**b) Red del proyecto en `docker-compose.yml`:**
```yaml
networks:
  default:
    enable_ipv6: true
    ipam:
      config:
        - subnet: 172.28.0.0/16
        - subnet: fd00:dead:beef:1::/64
```
Docker exige un subnet IPv6 explícito por red definida por el usuario (no lo autoasigna como con IPv4), de ahí declarar tanto el subnet v4 como el v6.

**Resultado:** con ambos cambios aplicados y redeploy, `TypeOrmModule` conectó correctamente y la aplicación NestJS arrancó sin errores (`Nest application successfully started`).

> Nota: `NODE_OPTIONS=--dns-result-order=ipv4first` se dejó en el compose como medida de robustez adicional (útil si en el futuro el host de la DB pasa a ser dual-stack real), aunque no fue la solución definitiva de este caso.

### 3.4 Desajuste de puerto (`PORT` real vs. mapeo fijo)

**Síntoma:** tras resolver la conexión a la base de datos, la app arrancaba correctamente pero el log mostraba:
```
🚀 Servidor corriendo en el puerto: 3030
```
mientras el `docker-compose.yml` mapeaba `"${PORT:-3000}:3000"` — es decir, el lado del **contenedor** quedaba fijo en `3000`, ignorando que `PORT=3030` estaba seteado en Dokploy y que Nest escuchaba ahí dentro. El proxy de la plataforma no encontraba el puerto correcto → 502.

**Fix:**
```yaml
ports:
  - "${PORT:-3000}:${PORT:-3000}"
```
Ambos lados del mapeo usan la misma variable, de modo que el puerto publicado siempre coincide con el que la app realmente escucha, sea cual sea el valor de `PORT` en el entorno.

---

## 4. Estado final del `docker-compose.yml` (resumen funcional)

| Servicio  | Rol | Notas clave |
|---|---|---|
| `db` | Postgres 16 local (opcional si se usa DB externa) | Healthcheck `pg_isready`; volumen `pgdata` persistente |
| `app` | API NestJS en producción | `DATABASE_URL` inyectada completa desde el entorno; `NODE_OPTIONS=--dns-result-order=ipv4first`; puerto dinámico vía `PORT` |
| `migrate` | Ejecuta `migration:run` bajo demanda (`profiles: tools`) | Usa el stage `builder` (necesita `ts-node`); `NODE_ENV=development` para evitar el `ssl: true` que `data-source.ts` exige en producción |
| `seed` | Ejecuta `seed` bajo demanda (`profiles: tools`) | Igual que `migrate` |

Red del proyecto con `enable_ipv6: true` y subnets IPv4/IPv6 explícitos.

---

## 5. Variables de entorno críticas (deben coincidir con lo que la app espera)

| Variable | Dónde se usa | Observación |
|---|---|---|
| `DATABASE_URL` | `app.module.ts`, `data-source.ts` | Única fuente de conexión a DB; debe ir **completa y url-encodeada** si el password tiene caracteres especiales |
| `PORT` | `main.ts` (`app.listen(port)`) | Debe coincidir con el puerto configurado en el proxy/dominio de Dokploy |
| `FRONTEND_URL` | `main.ts` (CORS) | Obligatoria — su ausencia hace `throw` y mata el proceso al bootstrap |
| `NODE_ENV` | `data-source.ts` (SSL condicional) | En `production` fuerza `ssl: { rejectUnauthorized: false }` para migraciones/seed contra Postgres local sin TLS, esto rompe — de ahí forzar `development` en esos servicios |

---

## 6. Lecciones / recomendaciones a futuro

1. **No construir connection strings por interpolación de shell/YAML.** Si el código de la app espera una única `DATABASE_URL`, esa variable debe entregarse ya completa desde el gestor de secretos/plataforma, nunca ensamblada a partir de piezas sueltas dentro del compose.
2. **Verificar familia de IP del host de base de datos** antes de asumir que un `ENETUNREACH` es un problema de credenciales o de red local. `dig` o `getent hosts <host>` en el VPS habría mostrado el registro AAAA directamente.
3. **Docker no hereda IPv6 del host automáticamente.** Si el proveedor de base de datos (o cualquier servicio externo) requiere IPv6, hay que habilitarlo explícitamente en `daemon.json` **y** en la red de Compose — son dos configuraciones independientes.
4. **El mapeo de puertos en Compose debe ser dinámico si el puerto de escucha de la app también lo es** (`app.listen(process.env.PORT)`); fijar un lado del mapeo mientras el otro es variable es una fuente de 502 silenciosos.
5. Mantener `container_name` fuera de compose en entornos de despliegue continuo evita colisiones entre redeploys.
