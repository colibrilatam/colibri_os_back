---
id: BACK-001
title: Crear endpoints publicos /health y /ready
state: open
---

## Contexto

La auditoria detecto que el backend no expone verificaciones publicas de salud y readiness.
Sin estas rutas no hay una forma estandar de confirmar disponibilidad desde Render o desde
monitoreo externo.

## Alcance

- Crear `GET /api/v1/health` sin autenticacion.
- Crear `GET /api/v1/ready` sin autenticacion.
- `health` debe devolver `status`, `service`, `version`, `uptime` y `timestamp`.
- `ready` debe validar PostgreSQL y responder `503` si la base no esta disponible.
- No exponer secretos ni detalles internos.

## Criterios de aceptacion

- `GET /api/v1/health` responde `200` sin auth.
- `GET /api/v1/ready` responde `200` cuando PostgreSQL esta operativo.
- Si PostgreSQL cae, `GET /api/v1/ready` responde `503`.
- Ninguna respuesta expone variables sensibles.

## Pruebas negativas

- Detener PostgreSQL y verificar `503` en readiness.
- Confirmar que no se filtran secretos.

## Prioridad

Release blocker.

## Equipo

Backend / DevOps.
