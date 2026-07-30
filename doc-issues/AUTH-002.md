---
id: AUTH-002
title: Estabilizar endpoint y sesion de acceso como invitado
state: open
---

## Contexto

El flujo de invitado o demo no estaba estabilizado y podia bloquear una validacion funcional.
Se necesita un camino independiente, idempotente y observable.

## Alcance

- Definir el flujo backend para acceso como invitado.
- Hacer que el flujo sea idempotente.
- Reutilizar o recrear la sesion demo de forma segura.
- Evitar lookups de usuarios inexistentes.
- Soportar refresh y reset de la sesion.
- Devolver errores claros cuando el proyecto demo no exista o el backend este lento.

## Criterios de aceptacion

- El invitado entra sin registro previo.
- La sesion demo se crea o se reutiliza.
- El flujo soporta refresh.
- El flujo puede resetearse de forma segura.
- El backend responde con errores claros ante estados invalidos.

## Pruebas negativas

- Sesion expirada.
- Entrada repetida consecutiva.
- Proyecto demo inexistente.

## Prioridad

Release blocker.

## Equipo

Backend / Frontend.
