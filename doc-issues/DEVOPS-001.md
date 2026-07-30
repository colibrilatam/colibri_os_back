---
id: DEVOPS-001
title: Auditar configuracion y despliegue del backend en Render
state: open
---

## Contexto

La configuracion de despliegue debe quedar alineada con lo que espera Render: build,
start, variables de entorno, health checks y reinicios estables.

## Alcance

- Verificar el comando de build.
- Verificar el comando de start.
- Confirmar el directorio raiz del servicio.
- Confirmar la version de Node.
- Revisar variables: `DATABASE_URL`, `FRONTEND_URL` o `FRONTEND_URLS`, `JWT_SECRET`, `NODE_ENV`.
- Configurar health check en la ruta correcta.
- Validar que el servicio quede estable tras restart.

## Criterios de aceptacion

- `dist/main.js` se genera correctamente.
- El servicio arranca y se mantiene estable tras reinicio.
- `/health` y `/ready` responden `200`.
- El despliegue no depende de variables ausentes.

## Pruebas negativas

- Cambiar una variable critica y confirmar que el arranque falla de forma visible.

## Prioridad

Release blocker.

## Equipo

Backend / DevOps.
