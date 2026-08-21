# SEC-003 — Matriz de permisos (actor × recurso × acción)

> Estado: propuesta técnica, pendiente de aprobación por Producto y Seguridad.
> Fuente de verdad del código: `RolesGuard` + `@Roles()` (rol) y
> `ProjectAccessService` / `assertAssignedEvaluator` (propiedad, membresía, asignación).
>
> Nota de modelado: esta versión de Colibri no tiene entidad "Organización".
> El límite de aislamiento multi-tenant real es el **Proyecto** (dueño +
> `ProjectMember`). Toda referencia a "organización" en el ticket original se
> interpreta como "proyecto" en esta matriz.

## Leyenda de reglas
- **Rol**: alcanza con tener el rol (`RolesGuard`).
- **Ownership**: `project.ownerUserId === principal.userId`.
- **Membresía**: fila activa en `project_members` para ese proyecto.
- **Membresía-operador**: membresía + `isPrimaryOperator = true`.
- **Asignación**: `evaluation.createdByUserId === principal.userId` (el
  evaluador que abrió la evaluación).
- **Global**: `ADMIN` puentea todas las reglas de recurso.

| Recurso | Acción | Rol requerido | Regla de recurso | Dónde se aplica hoy |
|---|---|---|---|---|
| Proyecto | Ver | cualquiera autenticado | Ownership o Membresía o Global | `ProjectAccessService.assertCanAccessProject` |
| Proyecto | Editar / Borrar | cualquiera autenticado | Ownership o Membresía-operador o Global | `ProjectAccessService.assertCanManageProject` |
| ProjectPac | Crear / Editar / Borrar | cualquiera autenticado | Ownership o Membresía-operador o Global | `ProjectAccessService.assertCanManageProject` |
| Categorías / PACs / Microacciones (catálogo global) | Crear/Editar/Borrar | `ADMIN` | — (no es propiedad de nadie, es catálogo) | `@Roles(ADMIN)` (ver SEC-002) |
| Evaluación | Crear | `ADMIN`, `EVALUATOR`, `ENTREPRENEUR` | Membresía del proyecto de la evidencia | `assertCanAccessProject` |
| Evaluación | Registrar revisión humana | `ADMIN`, `EVALUATOR`, `MENTOR` | Membresía del proyecto **+ Asignación** ⚠️ | `assertCanAccessProject` (falta Asignación → **fix en este ticket**) |
| Evaluación | Finalizar | `ADMIN`, `EVALUATOR`, `ENTREPRENEUR` | Membresía del proyecto + Asignación | `assertCanAccessProject` + `assertAssignedEvaluator` |
| Rúbrica | Crear/Editar | `ADMIN` | — (catálogo global) | `@Roles(ADMIN)` |
| NFT de proyecto | Ver / Borrar | `ADMIN` | — | `@Roles(ADMIN)` (ver SEC-002) |
| NFT Actor / Portfolio Mecenas | Editar | cualquiera autenticado | Ownership o Global | ya cubierto (IDOR, SEC-006C) |
| Miembros de proyecto | Agregar/Quitar | cualquiera autenticado | Ownership o Membresía-operador o Global | ya cubierto |

## Pendientes explícitos para Producto y Seguridad
1. ¿"Membresía" alcanza para `submitHumanReview`, o debe requerir Asignación como `finalize`? (recomendación de este ticket: **sí, requerir Asignación**).
2. ¿Debe existir un concepto de "Organización" por encima de "Proyecto" a futuro (multi-proyecto por organización, admins delegados por organización)? Hoy no existe — si se aprueba, es un ticket de modelado de datos aparte.
3. Confirmar que el catálogo (categorías/PACs/microacciones/rúbricas) es intencionalmente global y no por proyecto.