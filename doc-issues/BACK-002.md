---
id: BACK-002
title: Capturar y registrar errores fatales de bootstrap
state: open
---

## Contexto

El bootstrap del backend no tenia una captura global suficientemente visible para fallos
criticos de Nest, TypeORM o configuracion. Cuando algo rompe al arrancar, Render puede quedarse
sin diagnostico util.

## Alcance

- Envolver `bootstrap()` con manejo de error global.
- Registrar el error en formato estructurado.
- Incluir commit SHA y entorno de ejecucion en el log.
- Finalizar el proceso con `exit(1)` cuando falle el arranque.
- No incluir secretos en el mensaje.

## Criterios de aceptacion

- Un fallo fatal muestra la causa raiz.
- El log permite identificar commit y entorno.
- El proceso sale con codigo distinto de cero.
- No se imprimen secretos ni variables sensibles.

## Pruebas negativas

- Arrancar sin `DATABASE_URL`.
- Simular un fallo de TypeORM.

## Prioridad

Release blocker.

## Equipo

Backend.
