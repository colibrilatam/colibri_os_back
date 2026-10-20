# SEC-004 — Checklist de validación en staging

**Fecha:** 2026-10-10
**Ambiente:** staging
**Responsable:**___

---

## 1. Pruebas negativas obligatorias

### 1.1 Rol elevado solo en cliente → 403 sin cambios en DB

| # | Prueba | Resultado |
|---|--------|-----------|
| 1 | Usuario entrepreneur intenta crear un tramo → 403 | [ ] |
| 2 | Usuario entrepreneur intenta revocar una credencial → 403 | [ ] |
| 3 | Usuario entrepreneur intenta activar a otro como mecenas → 403 | [ ] |

### 1.2 Aislamiento entre organizaciones → 403 sin filtrar existencia

| # | Prueba | Resultado |
|---|--------|-----------|
| 4 | Usuario de org A lee proyecto de org B → 403 | [ ] |
| 5 | Usuario de org A modifica proyecto de org B → 403 | [ ] |
| 6 | Usuario de org A elimina proyecto de org B → 403 | [ ] |
| 7 | Usuario de org A ve evidencias de org B → 403 | [ ] |
| 8 | Usuario de org A ve credenciales de org B → 403 | [ ] |

### 1.3 Evaluador no asignado → 403 y sin cambio de estado

| # | Prueba | Resultado |
|---|--------|-----------|
| 9 | Evaluador no asignado finaliza evaluación → 403 | [ ] |
| 10 | Estado de la evidencia no cambia | [ ] |
| 11 | Evaluador no asignado no ve pending-reviews de otro proyecto | [ ] |

---

## 2. Prueba de modificación de rol en DevTools

| # | Prueba | Resultado |
|---|--------|-----------|
| 12 | Abrir DevTools → Application → Local Storage → cambiar `rol` a `admin` | [ ] |
| 13 | Intentar crear un tramo con rol modificado en cliente → 403 (el backend ignora el rol del cliente) | [ ] |
| 14 | Verificar que el rol real (viene del JWT firmado) no cambia | [ ] |

---

## 3. Pruebas de autenticación

| # | Prueba | Resultado |
|---|--------|-----------|
| 15 | GET /projects sin token → 401 | [ ] |
| 16 | GET /evaluations/pending-reviews sin token → 401 | [ ] |
| 17 | POST /tramos sin token → 401 | [ ] |
| 18 | Usuario suspendido intenta iniciar sesión → 401 | [ ] |

---

## 4. Pruebas de permisos efectivos

| # | Prueba | Resultado |
|---|--------|-----------|
| 19 | GET /users/profile devuelve `permissions[]` | [ ] |
| 20 | Permisos de ADMIN incluyen `admin:access` | [ ] |
| 21 | Permisos de EVALUATOR incluyen `evaluation:approve:assigned` | [ ] |
| 22 | Permisos de EVALUATOR NO incluyen `project:read:all` | [ ] |

---

## 5. Regresión

| # | Prueba | Resultado |
|---|--------|-----------|
| 22 | Test e2e `sec-004-no-endpoint-without-guard` pasa | [ ] |
| 23 | Test e2e `sec-004-negative-authorization` pasa | [ ] |
| 24 | Suite completa de tests unitarios pasa (excepto falla preexistente en auth.service.spec) | [ ] |

---

## 6. Rollback

| # | Prueba | Resultado |
|---|--------|-----------|
| 25 | Plan de rollback documentado en `docs/security/rollback-plan.md` | [ ] |
| 26 | Commits organizados por área para rollback selectivo | [ ] |

---

## Notas

- Los tests e2e requieren una BD PostgreSQL local configurada en `.env`.
- La falla preexistente en `auth.service.spec.ts` no está relacionada con SEC-004.
- El OpenAPI se regenera automáticamente con `npm run contract:export`.
