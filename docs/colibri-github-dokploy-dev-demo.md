# Despliegue de Colibri con GitHub, Docker y Dokploy

## Arquitectura recomendada

Para el VPS `1930348` y el dominio `colibrilatam.io`:

| Entorno | Fuente | Dominio | API |
|---|---|---|---|
| Desarrollo | rama `develop` | `dev.colibrilatam.io` | API de desarrollo |
| Demo | GitHub Release `vX.Y.Z` | `demo.colibrilatam.io` | API de demo |

Crea **dos aplicaciones separadas en Dokploy**. No mezcles los contenedores ni los archivos `.env`.

> GitHub Release es la versión publicada. Dokploy es quien construye y ejecuta esa versión.

## 1. DNS

En el DNS de `colibrilatam.io`, crea estos registros `A`:

```text
dev    A    179.199.131.185
demo   A    179.199.131.185
```

Si el DNS está gestionado en otro proveedor, crea los registros allí. No uses forwarding para estos subdominios: deben resolver directamente al VPS.

Comprueba desde tu equipo:

```bash
dig +short dev.colibrilatam.io
dig +short demo.colibrilatam.io
```

Ambos deben devolver `179.199.131.185`.

## 2. Dockerfile para Next.js

Asegúrate de que el frontend escuche en todas las interfaces y en el puerto `3031`:

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3031
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3031
CMD ["node", "server.js"]
```

En `next.config.js` o `next.config.ts`, activa `output: 'standalone'`:

```js
const nextConfig = {
  output: 'standalone'
};

module.exports = nextConfig;
```

## 3. Docker Compose

Usa el mismo Compose en las dos aplicaciones de Dokploy, cambiando únicamente las variables de entorno dentro de Dokploy:

```yaml
services:
  colibri-client:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    container_name: ${CONTAINER_NAME:-colibri-client}
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3031
      HOSTNAME: 0.0.0.0
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    expose:
      - "3031"
    networks:
      - colibri-network

networks:
  colibri-network:
    name: ${NETWORK_NAME:-colibri-network}
```

No es necesario publicar `3031:3031` cuando Dokploy/Traefik enruta al contenedor por la red interna. Si publicas el puerto, no uses el mismo `container_name` ni la misma red para los dos entornos.

## 4. Aplicación `colibri-dev` en Dokploy

1. Crea una aplicación Compose llamada `colibri-dev`.
2. Conecta el repositorio de GitHub.
3. Selecciona la rama `develop`.
4. Usa el `docker-compose.yml` del repositorio.
5. Define estas variables en Dokploy, no en Git:

```env
CONTAINER_NAME=colibri-client-dev
NETWORK_NAME=colibri-network-dev
NEXT_PUBLIC_API_URL=https://api-dev.colibrilatam.io/api/v1
```

Si todavía no existe `api-dev.colibrilatam.io`, coloca temporalmente la URL real de la API de desarrollo y configura CORS para aceptar `https://dev.colibrilatam.io`.

6. En Domains añade:
   - Host: `dev.colibrilatam.io`
   - Container port: `3031`
   - HTTPS/Let's Encrypt: habilitado
7. Activa Auto Deploy y copia el webhook que entrega Dokploy.
8. Configura ese webhook en GitHub para la rama `develop`.

Flujo resultante:

```text
git push origin develop
        ↓
GitHub webhook
        ↓
Dokploy colibri-dev
        ↓
Docker build + deploy
        ↓
https://dev.colibrilatam.io
```

## 5. Aplicación `colibri-demo` en Dokploy

1. Crea una segunda aplicación Compose llamada `colibri-demo`.
2. Conecta el mismo repositorio.
3. Selecciona la rama `demo`.
4. Define variables separadas:

```env
CONTAINER_NAME=colibri-client-demo
NETWORK_NAME=colibri-network-demo
NEXT_PUBLIC_API_URL=https://api-demo.colibrilatam.io/api/v1
```

5. Añade el dominio `demo.colibrilatam.io` apuntando al puerto `3031`.
6. Activa HTTPS/Let's Encrypt.
7. Activa Auto Deploy para la rama `demo`.

La rama `demo` será una rama técnica que siempre apunta a la última Release aprobada.

## 6. Promover una Release a Demo

Crea `.github/workflows/promote-demo.yml`:

```yaml
name: Promote release to demo

on:
  release:
    types: [published]

permissions:
  contents: write

jobs:
  promote:
    if: startsWith(github.event.release.tag_name, 'v')
    runs-on: ubuntu-latest

    steps:
      - name: Move demo branch to released commit
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Promote release tag to demo branch
        run: |
          git fetch --tags --force
          git checkout -B demo "${{ github.event.release.tag_name }}"
          git push origin demo --force
```

Configura en GitHub:

```text
Settings → Actions → General → Workflow permissions → Read and write permissions
```

Flujo resultante:

```text
Crear tag v1.4.0
        ↓
Publicar GitHub Release
        ↓
GitHub mueve demo → v1.4.0
        ↓
Webhook de Dokploy
        ↓
Deploy en demo.colibrilatam.io
```

Para una Release manual:

```bash
git checkout develop
git pull
# después de validar dev:
git tag -a v1.4.0 -m "Release v1.4.0"
git push origin v1.4.0
```

Luego publica la Release desde GitHub usando ese tag.

## 7. Reglas de Git recomendadas

- `develop`: integración continua y despliegue automático en `dev`.
- `main`: código estable o rama protegida.
- `demo`: la controla exclusivamente el workflow de Releases.
- `vX.Y.Z`: versiones que pueden reproducirse y auditarse.
- Nunca guardes secretos en GitHub ni en el repositorio.
- Los valores `NEXT_PUBLIC_*` quedan incorporados en el build de Next.js; si cambian, hay que reconstruir la imagen.

## 8. Checklist para evitar el 404 actual

En `app.colibrilatam.io`, `dev.colibrilatam.io` y `demo.colibrilatam.io` revisa:

- DNS resuelve al VPS `179.199.131.185`.
- El contenedor está `running`.
- Next.js escucha en `0.0.0.0:3031`, no únicamente en `localhost`.
- Dokploy apunta al puerto interno `3031`.
- El dominio está agregado dentro de la aplicación correcta de Dokploy.
- No se reutilizan `container_name` ni redes entre dev y demo.
- El certificado corresponde al subdominio solicitado.
- CORS de la API permite el origen exacto del frontend.
- La API responde desde el VPS y no únicamente desde dentro del contenedor.

Comandos de diagnóstico en el VPS:

```bash
docker ps
docker logs --tail 100 colibri-client-dev
ss -lntp | grep 3031
curl -I https://dev.colibrilatam.io
curl -I https://demo.colibrilatam.io
```

## Decisión sobre Kubernetes

Para un único VPS con dos entornos, **no introduciría Kubernetes todavía**. Dokploy + Docker Compose + Traefik cubre el objetivo con menos complejidad.

Kubernetes tendría sentido cuando necesites varios nodos, alta disponibilidad, escalado horizontal real, despliegues canary/blue-green o varios equipos operando servicios independientes. Primero dejaría estable el flujo GitHub → Dokploy → Docker; después se puede migrar la misma separación de entornos a Kubernetes.