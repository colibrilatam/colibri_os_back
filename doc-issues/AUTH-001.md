---
id: AUTH-001
title: Auditar y corregir inconsistencias de usuarios y autenticacion
state: open
---

## Contexto

La auditoria detecto inconsistencias en el acceso: normalizacion de email, posibles registros
duplicados, diferencias entre cuentas locales y Google, y errores poco coherentes para el usuario.

## Alcance

- Auditar la tabla `users`.
- Normalizar emails con `trim()` y `toLowerCase()`.
- Revisar conflicto entre provider local y Google.
- Evitar registros parciales o incoherentes.
- Devolver errores consistentes para duplicados y credenciales invalidas.

## Criterios de aceptacion

- Un email ya existente devuelve `409`.
- Credenciales invalidas devuelven `401`.
- Un usuario valido puede entrar con el email original.
- No hay duplicados logicos ni registros parciales.
- El flujo local y Google queda cubierto por tests.

## Pruebas negativas

- Email con mayusculas.
- Email con espacios.
- Doble registro.
- Fallo de base de datos durante signup.
- Conflicto entre cuenta local y Google.

## Prioridad

Release blocker.

## Equipo

Backend / Database.
