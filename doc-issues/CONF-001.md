---
id: CONF-001
title: Corregir configuracion CORS para produccion y previews autorizadas
state: open
---

## Contexto

La configuracion actual de CORS no debe depender de un unico `FRONTEND_URL` si el proyecto
trabaja con produccion y previews. Hace falta una lista explita de origenes permitidos.

## Alcance

- Sustituir la configuracion unica por `FRONTEND_URLS` o equivalente.
- Normalizar y validar los origenes permitidos.
- Habilitar `credentials` de forma explicita.
- Bloquear origenes no autorizados.
- Cubrir la logica con tests.

## Criterios de aceptacion

- El dominio de produccion queda autorizado.
- Las previews permitidas tambien quedan autorizadas.
- Un origen no autorizado queda bloqueado.
- Los tests de CORS pasan.

## Pruebas negativas

- URL mal formada.
- Origen no autorizado.

## Prioridad

Release blocker.

## Equipo

Backend / DevOps.
