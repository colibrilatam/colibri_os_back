# Bateria QA - Auditoria 30-07-2026

Objetivo: validar los hallazgos criticos del informe de auditoria sobre disponibilidad, salud, CORS y autenticacion.

## Cobertura automatizada

- `qa-auditoria.e2e-spec.ts`
  - H-01 y H-02: `GET /api/v1/health` y `GET /api/v1/ready`.
  - H-03: normalizacion de origenes CORS y header permitido.
  - AUTH-001: signup, login, perfil, duplicados, credenciales invalidas y cuenta Google vs login local.
  - QA-001: smoke de acceso con token valido.
- `users-service-normalization.e2e-spec.ts`
  - Normalizacion de email con `trim()` y `toLowerCase()`.
  - Deteccion de duplicados sin importar el casing.

## Cobertura manual pendiente

- Flujo real de invitado: no se encontro un endpoint publico backend dedicado.
- Bootstrap fatal y logs estructurados en Render.
- CI/CD, migraciones y observabilidad de infraestructura.

## Ejecucion

```powershell
npm run test:e2e -- --runInBand
```
