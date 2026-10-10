# Matriz de autorización — actor / recurso / acción

**Estado:** PROPUESTA (pendiente de aprobación)
**Versión:** 0.1
**Fecha:** 2026-10-10
**Contexto:** SEC-004 — Autorización real en backend
**Decisiones incorporadas:** D1 (EVALUATOR por asignación), D2 (complete-profile restringido), D3 (lectura catálogo = cualquier rol autenticado), D4 (403 cross-org), D5 (rol fresco de DB + sessionVersion), D6 (stubs con guard por defecto)

---

## 1. Principios rectoras

1. **Deny by default.** Todo endpoint requiere autenticación salvo los explícitamente marcados como públicos (`@Public()`) y justificados en la §7.
2. **La organización sale del recurso en la DB**, nunca de un parámetro del cliente. Toda query de recursos queda acotada por organización/membresía.
3. **Códigos de error:**
   - **401** → no hay sesión válida (token ausente, inválido, revocado, o usuario suspendido/inactivo).
   - **403** → hay sesión válida pero no permiso para la acción sobre ese recurso. Se usa **403** (no 404) cuando el recurso existe pero pertenece a otra organización o el actor no tiene permiso.
4. **La identidad (actor) sale SIEMPRE de la sesión validada por el backend** (JWT en cookie HttpOnly firmado, validado contra DB en cada request). Nunca de body, query, headers custom ni claims que el cliente pueda fijar.
5. **El rol efectivo es el que devuelve `JwtStrategy.validate` (fresco de DB)**, no el claim del token. Si `sessionVersion` no coincide, la sesión se considera inválida (401).
6. **`sessionVersion` se incrementa** cuando: se cambia el rol de un usuario, se suspende/desactiva, o cambia su membresía (agregar/quitar/cambiar rol en proyecto). Esto invalida sesiones viejas inmediatamente.
7. **Chequear antes de mutar.** La autorización se resuelve antes de cualquier escritura. Operaciones multi-paso usan transacciones.
8. **Un único punto de decisión.** Toda autorización pasa por `AuthorizationService.can(actor, action, resource)` o los guards/decoradores reutilizables. Nada de `if (user.role === ...)` suelto en controllers o servicios.
9. **Zustand es solo presentación.** El frontend consume permisos efectivos calculados por el backend para adaptar la UI. Modificar el store de Zustand no cambia los permisos reales.

---

## 2. Actores

| Actor | Descripción | Condiciones de membresía / asignación |
|---|---|---|
| **ADMIN** | Administrador global | Sin condiciones. Acceso total a todos los recursos y acciones. |
| **ENTREPRENEUR** | Emprendedor | Es owner de un proyecto (`Project.ownerUserId`) o miembro activo de un proyecto. |
| **MENTOR** | Mentor | Miembro activo de un proyecto. |
| **EVALUATOR** | Evaluador | **Asignado** como evaluador de una evidencia/evaluación específica (`Evaluation.createdByUserId === userId`). **NO tiene acceso global a proyectos** (D1). |
| **MECENAS_SEMILLA** | Mecenas semilla | Usuario con rol mecenas_semilla. Opera sobre su propio portafolio. |
| **MECENAS_FUNDACIONAL** | Mecenas fundacional | Igual que semilla, con su propio portafolio. |
| **MECENAS_CAMBIO** | Mecenas cambio | Igual que semilla, con su propio portafolio. |
| **GUEST** | Invitado | Sin acceso a recursos protegidos. |

### Nota sobre EVALUATOR (D1)
Antes de SEC-004, `ProjectAccessService` daba acceso global a EVALUATOR. A partir de ahora:
- EVALUATOR **no** puede listar todos los proyectos.
- EVALUATOR **no** puede acceder a un proyecto salvo que esté asignado como evaluador de al menos una evidencia/evaluación de ese proyecto.
- La asignación se determina por `Evaluation.createdByUserId === userId` (el evaluador que creó la evaluación es el asignado).

---

## 3. Recursos

| Recurso | Dueño / scope | Notas |
|---|---|---|
| **Project** | Organización = Proyecto | `Project.ownerUserId` o membresía. |
| **ProjectMember** | Proyecto | Membresía de un usuario en un proyecto. |
| **ProjectProfile** | Proyecto | Perfil de un proyecto. |
| **ProjectPac** | Proyecto | PAC (Plan de Acción de Compromiso) de un proyecto. |
| **Tramo** | Proyecto | Tramo (etapa) de un proyecto. |
| **TramoClosure** | Proyecto | Cierre de tramo de un proyecto. |
| **MicroActionDefinition** | Global (catálogo) | Definición de microacción. Lectura = catálogo público autenticado. |
| **MicroActionInstance** | Proyecto | Instancia de microacción dentro de un proyecto. |
| **Evidence** | Proyecto | Evidencia de una microacción. |
| **Evaluation** | Proyecto (vía Evidence) | Evaluación de una evidencia. |
| **Rubric** | Global (catálogo) | Rúbrica de evaluación. Lectura = catálogo público autenticado. |
| **NftProject** | Proyecto | NFT de un proyecto. |
| **MecenasNftPortfolio** | Usuario (mecenas) | Portafolio de NFTs de un mecenas. |
| **NftOwnershipEvent** | Proyecto / Usuario | Evento de transferencia de NFT. |
| **NftActor** | Usuario | Actor NFT (registro por usuario). |
| **DigitalCredential** | Proyecto / Usuario | Credencial digital emitida. |
| **Reputation** | Proyecto | Snapshot de reputación de un proyecto. |
| **LearningResource** | Global (catálogo) | Recurso de aprendizaje. Lectura = catálogo público autenticado. |
| **Curriculum** | Global (catálogo) |Currículo. Lectura = catálogo público autenticado. |
| **Category** | Global (catálogo) | Categoría. Lectura = catálogo público autenticado. |
| **Pac** | Global (catálogo) | PAC (catálogo curricular). Lectura = catálogo público autenticado. |
| **User** | Usuario (sí mismo) / ADMIN | Perfil de usuario. |
| **Hierarchy** | Global | Jerarquía organizacional. Lectura = público (D3: cualquier rol autenticado). |
| **Execution** | Global (stub) | Ejecución. Stub. |
| **Analytics** | Global (stub) | Analítica. Stub. |
| **Health** | Global | Health check. Público. |

---

## 4. Matriz por recurso

### 4.1 Project

| Acción | ADMIN | ENTREPRENEUR | MENTOR | EVALUATOR | MECENAS_* | GUEST |
|---|---|---|---|---|---|---|
| **create** (POST /projects) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **read** (GET /projects, /projects/:id) | ✅ | ✅ (suyos / donde sea miembro activo) | ✅ (donde sea miembro activo) | ❌ (D1: no global) | ❌ | ❌ |
| **update** (PATCH /projects/:id) | ✅ | ✅ (solo si owner) | ✅ (solo si `isPrimaryOperator`) | ❌ | ❌ | ❌ |
| **delete** (DELETE /projects/:id) | ✅ | ✅ (solo si owner) | ✅ (solo si `isPrimaryOperator`) | ❌ | ❌ | ❌ |

**Regla exacta:**
- `read`: miembro activo del proyecto, o owner, o ADMIN.
- `update`/`delete`: owner, o miembro con `isPrimaryOperator: true`, o ADMIN.
- Recurso de otro proyecto → **403** (D4).

---

### 4.2 ProjectMember

| Acción | ADMIN | ENTREPRENEUR (owner / primary op) | MENTOR | Otros |
|---|---|---|---|---|
| **create** (agregar miembro) | ✅ | ✅ | ❌ | ❌ |
| **read** (listar / ver) | ✅ | ✅ (miembros de su proyecto) | ✅ (miembros de su proyecto) | ❌ |
| **update** (rol, peso, etc.) | ✅ | ✅ (solo owner o primary op) | ❌ | ❌ |
| **delete** (remover) | ✅ | ✅ (solo owner o primary op) | ❌ | ❌ |

**Regla exacta:**
- Toda operación sobre membresía requiere `assertCanManageProject` (owner, `isPrimaryOperator`, o ADMIN).
- `read` requiere `assertCanAccessProject` (miembro activo, owner, o ADMIN).
- Recurso de otro proyecto → **403**.

---

### 4.3 ProjectProfile

| Acción | ADMIN | Owner / PrimaryOp | Miembro activo | Otros |
|---|---|---|---|---|
| **create** | ✅ | ✅ | ❌ | ❌ |
| **read** | ✅ | ✅ | ✅ | ❌ |
| **update** | ✅ | ✅ | ❌ | ❌ |
| **delete** | ✅ | ✅ | ❌ | ❌ |

**Regla exacta:** `read` = `assertCanAccessProject`; `create/update/delete` = `assertCanManageProject`. Cross-org → 403.

---

### 4.4 ProjectPac

| Acción | ADMIN | Owner / PrimaryOp | Miembro activo | Otros |
|---|---|---|---|---|
| **create** (POST /projects/:projectId/pac/:pacId) | ✅ | ✅ | ❌ | ❌ |
| **read** (GET /projects/pac/:id) | ✅ | ✅ | ✅ | ❌ |
| **update** (PATCH /projects/pac/:id) | ✅ | ✅ | ❌ | ❌ |
| **delete** (DELETE /projects/pac/:id) | ✅ | ✅ | ❌ | ❌ |

**Regla exacta:** `read` = `assertCanAccessProject`; mutaciones = `assertCanManageProject`. Cross-org → 403.

---

### 4.5 Tramo

| Acción | ADMIN | Owner / PrimaryOp | Miembro activo | Otros |
|---|---|---|---|---|
| **create** (POST /tramos) | ✅ | ✅ (de su proyecto) | ❌ | ❌ |
| **read** (GET /tramos, /tramos/:id, /tramos/project/:projectId) | ✅ | ✅ | ✅ | ❌ |
| **read history** (GET /tramos/project/:projectId/history) | ✅ | ✅ | ✅ | ❌ |
| **update** (PATCH /tramos/:id) | ✅ | ✅ (solo owner) | ❌ | ❌ |
| **delete** (DELETE /tramos/:id) | ✅ | ✅ (solo owner) | ❌ | ❌ |
| **change active** (POST /tramos/project/:projectId/change) | ✅ | ✅ (solo owner) | ❌ | ❌ |

**Regla exacta:** `read` = `assertCanAccessProject`; mutaciones = `assertCanManageProject` (solo owner o ADMIN, no primary op para tramos). Cross-org → 403.

---

### 4.6 TramoClosure

| Acción | ADMIN | Owner / PrimaryOp | Miembro activo | Otros |
|---|---|---|---|---|
| **evaluate** (POST /tramo-closure/evaluate) | ✅ | ✅ | ✅ | ❌ |
| **read reconciliation** (GET /tramo-closure/reconciliation) | ✅ | ✅ (solo de su proyecto) | ✅ (solo de su proyecto) | ❌ |
| **close** (POST /tramo-closure/close) | ✅ | ✅ (solo owner) | ❌ | ❌ |

**Regla exacta:** `evaluate` = `assertCanAccessProject`; `close` = `assertCanManageProject` (solo owner o ADMIN); `reconciliation` = `assertCanAccessProject`. Cross-org → 403.

---

### 4.7 MicroActionDefinition (catálogo)

| Acción | ADMIN | Cualquier rol autenticado | Sin sesión |
|---|---|---|---|
| **create** | ✅ | ❌ | ❌ |
| **read** (GET /, /:id) | ✅ | ✅ | ❌ |
| **update** | ✅ | ❌ | ❌ |
| **delete** | ✅ | ❌ | ❌ |

**Regla exacta (D3):** lectura = cualquier rol autenticado (catálogo). Mutaciones = ADMIN. Sin sesión → 401.

---

### 4.8 MicroActionInstance

| Acción | ADMIN | Owner / PrimaryOp | Miembro activo | Actor asignado | Otros |
|---|---|---|---|---|---|
| **create** | ✅ | ✅ | ✅ | ✅ (si es actor) | ❌ |
| **read by project** (GET /project/:projectId) | ✅ | ✅ | ✅ | ❌ | ❌ |
| **read one** (GET /:id) | ✅ | ✅ (vía proyecto) | ✅ (vía proyecto) | ✅ (si es actor) | ❌ |
| **read all** (GET /all) | ✅ | ❌ | ❌ | ❌ | ❌ |
| **read versions** (GET /:id/versions) | ✅ | ✅ (vía proyecto) | ✅ (vía proyecto) | ✅ (si es actor) | ❌ |
| **create version** (POST /:id/versions) | ✅ | ✅ | ✅ | ✅ (si es actor) | ❌ |
| **update version** (PATCH /versions/:versionId) | ✅ | ❌ | ❌ | ✅ (solo si es actor Y evaluador asignado) | ❌ |
| **update instance** (PATCH /:id) | ✅ | ✅ (vía manage) | ❌ | ✅ (si es actor) | ❌ |
| **delete instance** (DELETE /:id) | ✅ | ✅ (vía manage) | ❌ | ❌ | ❌ |

**Regla exacta:**
- `read` requiere `assertCanAccessProject` O ser el `actorUserId` de la instancia.
- `read all` = ADMIN.
- `update version` = EVALUATOR asignado (D1) o ADMIN.
- Mutaciones = `assertCanManageProject` o ser el actor.
- Cross-org → 403.

---

### 4.9 Evidence

| Acción | ADMIN | Autor (owner) | Miembro activo | Evaluador asignado | Otros |
|---|---|---|---|---|---|
| **create** (POST /evidence) | ✅ | ✅ (si es autor) | ✅ (si es autor) | ❌ | ❌ |
| **read by project** (GET /project/:projectId) | ✅ | ✅ (vía acceso) | ✅ (vía acceso) | ✅ (solo si evaluador asignado de una evidencia del proyecto) | ❌ |
| **read one** (GET /:id) | ✅ | ✅ (autor o acceso) | ✅ (vía acceso) | ✅ (solo si evaluador asignado) | ❌ |
| **read versions** (GET /:id/versions) | ✅ | ✅ (autor o acceso) | ✅ (vía acceso) | ✅ (solo si evaluador asignado) | ❌ |
| **update** (PATCH /:id) | ✅ | ✅ (solo autor) | ❌ | ❌ | ❌ |
| **delete** (DELETE /:id) | ✅ | ✅ (solo autor) | ❌ | ❌ | ❌ |
| **submit** (POST /:id/submit) | ✅ | ✅ (solo autor) | ❌ | ❌ | ❌ |
| **retry deletion** (POST /:id/retry-deletion) | ✅ | ❌ | ❌ | ❌ | ❌ |

**Regla exacta:**
- `create`: autor = `Evidence.authorUserId === userId` Y `assertCanAccessProject`.
- `read`: `assertCanAccessProject` O ser el autor O ser evaluador asignado de esa evidencia.
- `update`/`delete`/`submit`: solo el autor (o ADMIN).
- `retry deletion`: ADMIN.
- Cross-org → 403.

---

### 4.10 Evaluation

| Acción | ADMIN | Evaluador asignado | Autor de la evidencia | Miembro activo | Otros |
|---|---|---|---|---|---|
| **create** (POST /evaluations) | ✅ | ✅ (evaluador asignado) | ✅ | ✅ | ❌ |
| **read pending** (GET /pending-reviews) | ✅ | ✅ (solo asignadas a él) | ❌ | ❌ | ❌ |
| **read by evidence** (GET /evidence/:evidenceId) | ✅ | ✅ (solo asignadas a él) | ✅ (autor) | ✅ (vía acceso) | ❌ |
| **read one** (GET /:id) | ✅ | ✅ (solo asignadas a él) | ✅ (autor) | ✅ (vía acceso) | ❌ |
| **human review** (POST /human-review) | ✅ | ✅ (solo asignado) | ❌ | ❌ | ❌ |
| **finalize** (POST /finalize) | ✅ | ✅ (solo asignado) | ❌ | ❌ | ❌ |
| **ai result** (POST /ai-result) | ✅ | ❌ | ❌ | ❌ | ❌ |

**Regla exacta:**
- `create`: `assertCanAccessProject` + rol EVALUATOR o ENTREPRENEUR.
- `human review`/`finalize`: `assertAssignedEvaluator` (evaluador asignado = `Evaluation.createdByUserId`) o ADMIN.
- `read pending`: evaluador asignado o ADMIN (D1: no global).
- `ai result`: ADMIN.
- Cross-org → 403.

---

### 4.11 Rubric (catálogo)

| Acción | ADMIN | Cualquier rol autenticado | Sin sesión |
|---|---|---|---|
| **create** (POST /evaluations/rubrics) | ✅ | ❌ | ❌ |
| **read** (GET /rubrics, /active, /:id) | ✅ | ✅ | ❌ |
| **update** (PATCH /rubrics/:id) | ✅ | ❌ | ❌ |
| **delete** | — | — | — |

**Regla exacta (D3):** lectura = cualquier rol autenticado. Mutaciones = ADMIN. Sin sesión → 401.

---

### 4.12 NftProject

| Acción | ADMIN | Owner / PrimaryOp | Miembro activo | Otros |
|---|---|---|---|---|
| **create** (POST /nft-projects/:projectId) | ✅ | ✅ | ❌ | ❌ |
| **read all** (GET /nft-projects) | ✅ | ❌ | ❌ | ❌ |
| **read by project** (GET /by-project/:projectId) | ✅ | ✅ | ✅ | ❌ |
| **read one** (GET /:id) | ✅ | ✅ (vía acceso) | ✅ (vía acceso) | ❌ |
| **update** (PATCH /:id) | ✅ | ✅ (vía manage) | ❌ | ❌ |
| **delete** (DELETE /:id) | ✅ | ❌ | ❌ | ❌ |
| **check** (GET /check/:projectId) | ✅ | ✅ | ✅ | ❌ |
| **associate** (POST /associate) | ✅ | ✅ (dueño del NFT) | ❌ | ❌ |

**Regla exacta:** `read` = `assertCanAccessProject` o `assertCanAccessNft`; `update`/`associate` = `assertCanManageProject` + ownership; `delete`/`read all` = ADMIN. Cross-org → 403.

---

### 4.13 MecenasNftPortfolio

| Acción | ADMIN | Mecenas dueño | Otros |
|---|---|---|---|
| **create** | ✅ | ✅ (solo su propio `mecenasUserId`) | ❌ |
| **read me** (GET /mecenas) | ✅ | ✅ (solo su propio) | ❌ |
| **read one** (GET /nft-project/:id) | ✅ | ✅ (solo si es dueño de la entrada) | ❌ |
| **update** (PATCH /nft-project/:id) | ✅ | ✅ (solo si es dueño de la entrada) | ❌ |

**Regla exacta:** toda operación sobre una entrada de portafolio requiere que `MecenasNftPortfolio.mecenasUserId === userId` (o ADMIN). Cross-user → 403.

---

### 4.14 NftOwnershipEvent

| Acción | ADMIN | Dueño del NFT / proyecto | Otros |
|---|---|---|---|
| **create** | ✅ | ✅ (dueño del NFT) | ❌ |
| **read by nft-project** (GET /by-nft-project/:nftProjectId) | ✅ | ✅ (vía acceso al proyecto) | ❌ |
| **read by user** (GET /by-user/:userId) | ✅ | ✅ (solo su propio) | ❌ |
| **reconcile** (POST /:id/reconcile) | ✅ | ❌ | ❌ |

**Regla exacta:** `read by user` = solo el propio usuario; `read by nft-project` = `assertCanAccessProject`. Cross-org/cross-user → 403.

---

### 4.15 NftActor

| Acción | ADMIN | Usuario dueño | Otros |
|---|---|---|---|
| **create** | ✅ | ✅ (solo su propio `userId`) | ❌ |
| **read me** (GET /user) | ✅ | ✅ (solo su propio) | ❌ |
| **read one** (GET /:id) | ✅ | ✅ (solo si `NftActor.userId === userId`) | ❌ |
| **update** (PATCH /:id) | ✅ | ✅ (solo si `NftActor.userId === userId`) | ❌ |

**Regla exacta:** toda operación sobre un NftActor requiere que `NftActor.userId === userId` (o ADMIN). Cross-user → 403.

---

### 4.16 DigitalCredential

| Acción | ADMIN | Owner / Miembro del proyecto | Otros |
|---|---|---|---|
| **read by project** (GET /project/:projectId) | ✅ | ✅ (`assertCanAccessProject`) | ❌ |
| **read by user** (GET /user/:userId) | ✅ | ✅ (solo su propio) | ❌ |
| **read one** (GET /:id) | ✅ | ✅ (vía proyecto o si es suya) | ❌ |
| **revoke** (POST /:id/revoke) | ✅ | ❌ | ❌ |

**Regla exacta:** `read` = `assertCanAccessProject` o `DigitalCredential.userId === userId`; `revoke` = ADMIN. Cross-org/cross-user → 403.

---

### 4.17 Reputation

| Acción | ADMIN | Owner / PrimaryOp | Miembro activo | Otros |
|---|---|---|---|---|
| **create algorithm version** | ✅ | ❌ | ❌ | ❌ |
| **read algorithm versions** | ✅ | ✅ (vía `assertCanAccessProject`) | ✅ (vía acceso) | ❌ |
| **calculate** (POST /calculate) | ✅ | ✅ (solo de su proyecto) | ❌ | ❌ |
| **read latest** (GET /projects/:projectId/latest) | ✅ | ✅ (vía acceso) | ✅ (vía acceso) | ❌ |
| **read history** (GET /projects/:projectId/history) | ✅ | ✅ (vía acceso) | ✅ (vía acceso) | ❌ |
| **read snapshot** (GET /snapshots/:id) | ✅ | ✅ (vía proyecto) | ✅ (vía proyecto) | ❌ |

**Regla exacta:** `read` = `assertCanAccessProject`; `calculate` = owner o ADMIN. Cross-org → 403.

---

### 4.18 LearningResource (catálogo)

| Acción | ADMIN | Cualquier rol autenticado | Sin sesión |
|---|---|---|---|
| **create** | ✅ | ❌ | ❌ |
| **read** | ✅ | ✅ | ❌ |
| **update** | ✅ | ❌ | ❌ |
| **delete** | ✅ | ❌ | ❌ |
| **hard delete** | ✅ | ❌ | ❌ |

**Regla exacta (D3):** lectura = cualquier rol autenticado. Mutaciones = ADMIN. Sin sesión → 401.

---

### 4.19 Curriculum (catálogo)

| Acción | ADMIN | Cualquier rol autenticado | Sin sesión |
|---|---|---|---|
| **create** | ✅ | ❌ | ❌ |
| **read** | ✅ | ✅ | ❌ |
| **update** | ✅ | ❌ | ❌ |
| **delete** | ✅ | ❌ | ❌ |

**Regla exacta (D3):** lectura = cualquier rol autenticado. Mutaciones = ADMIN. Sin sesión → 401.

---

### 4.20 Category (catálogo)

| Acción | ADMIN | Cualquier rol autenticado | Sin sesión |
|---|---|---|---|
| **create** | ✅ | ❌ | ❌ |
| **read** | ✅ | ✅ | ❌ |
| **update** | ✅ | ❌ | ❌ |
| **delete** | ✅ | ❌ | ❌ |

**Regla exacta (D3):** lectura = cualquier rol autenticado. Mutaciones = ADMIN. Sin sesión → 401.

---

### 4.21 Pac (catálogo)

| Acción | ADMIN | Cualquier rol autenticado | Sin sesión |
|---|---|---|---|
| **create** | ✅ | ❌ | ❌ |
| **read** | ✅ | ✅ | ❌ |
| **update** | ✅ | ❌ | ❌ |
| **delete** | ✅ | ❌ | ❌ |

**Regla exacta (D3):** lectura = cualquier rol autenticado. Mutaciones = ADMIN. Sin sesión → 401.

---

### 4.22 User

| Acción | ADMIN | Usuario (sí mismo) | Otros |
|---|---|---|---|
| **read profile** (GET /users/profile) | ✅ | ✅ (solo su propio) | ❌ |
| **read all** (GET /users) | ✅ | ❌ | ❌ |
| **read one** (GET /users/:id) | ✅ | ✅ (solo su propio) | ❌ |
| **update password** (PATCH /users/me/password) | ✅ | ✅ (solo su propio) | ❌ |
| **update user** (PATCH /users/:id) | ✅ | ✅ (solo su propio) | ❌ |
| **delete user** (DELETE /users/:id) | ✅ | ✅ (solo su propio) | ❌ |
| **change role** (PATCH /users/:id/role) | ✅ | ❌ | ❌ |
| **change status** (PATCH /users/:id/status) | ✅ | ❌ | ❌ |
| **complete profile** (POST /auth/complete-profile) | — | ✅ (solo `evaluator` o `entrepreneur`, fallback `entrepreneur`) — **D2** | ❌ |

**Regla exacta:** `assertSelfOrAdmin` para operaciones sobre sí mismo; ADMIN para operaciones sobre otros. `complete-profile` = D2. Cross-user → 403.

---

### 4.23 Hierarchy

| Acción | ADMIN | Cualquier rol autenticado | Sin sesión |
|---|---|---|---|
| **read** (GET /hierarchy, /shallow) | ✅ | ✅ | ❌ |

**Regla exacta (D3):** lectura = cualquier rol autenticado. Sin sesión → 401.

---

### 4.24 Execution / Analytics (stubs)

| Acción | ADMIN | Cualquier rol autenticado | Sin sesión |
|---|---|---|---|
| **todos** | ✅ | ✅ (guard por defecto — D6) | ❌ |

**Regla exacta (D6):** guard por defecto = `JwtAuthGuard`. Sin lógica de negocio todavía. Sin sesión → 401.

---

### 4.25 Health

| Acción | ADMIN | Cualquier rol autenticado | Sin sesión |
|---|---|---|---|
| **read** (GET /health, /ready) | ✅ | ✅ | ✅ (público) |

**Regla exacta:** público. No requiere autenticación.

---

## 5. Reglas transversales

### 5.1 Recursos inexistentes
- Si el recurso **no existe en absoluto** → **404** (no hay nada que proteger).
- Si el recurso **existe pero pertenece a otra organización** (o el actor no tiene permiso) → **403** (D4).
- En operaciones de `read` por ID: primero se resuelve la organización del recurso desde la DB, luego se evalúa el permiso. Si el actor no tiene permiso, se devuelve 403 sin revelar detalles.

### 5.2 Usuarios sin membresía
- Un usuario auténtico sin membresía en ningún proyecto:
  - **Puede** crear un proyecto (POST /projects) → se convierte en owner.
  - **Puede** leer catálogos (categories, PACs, rubrics, learning-resources, curriculum, hierarchy, micro-action-definitions).
  - **No puede** leer/operar sobre proyectos, evidencias, evaluaciones, NFTs, etc. de otros proyectos.
  - **Puede** gestionar su propio perfil (users/me/*).

### 5.3 Múltiples membresías
- Un usuario puede ser miembro de varios proyectos. Los permisos se evalúan **por recurso**, no por usuario globalmente.
- El actor puede tener diferentes niveles de acceso en diferentes proyectos (owner en uno, mentor en otro, etc.).

### 5.4 Recursos globales vs. de proyecto
- **Recursos de proyecto** (Project, Tramo, Evidence, Evaluation, NftProject, etc.): la autorización depende de la membresía/propiedad del proyecto dueño.
- **Recursos globales** (Category, Pac, Rubric, LearningResource, Curriculum, MicroActionDefinition, Hierarchy): la autorización depende solo del rol (D3: cualquier rol autenticado para lectura, ADMIN para mutación).

### 5.5 EVALUATOR y asignación (D1)
- EVALUATOR **no** tiene acceso global a proyectos.
- EVALUATOR accede a un proyecto **solo si** está asignado como evaluador de al menos una evidencia/evaluación de ese proyecto.
- La asignación se determina por `Evaluation.createdByUserId === userId`.
- `pending-reviews` filtra por asignación, no globalmente.

---

## 6. Mapeo a guards / decoradores

| Concepto de la matriz | Implementación |
|---|---|
| Autenticación (401) | `JwtAuthGuard` (global o por controller) |
| Rol efectivo fresco de DB (D5) | `JwtStrategy.validate` devuelve `user.role` fresco; `RolesGuard` usa ese valor, no el claim del claim |
| Acceso a proyecto (read) | `ProjectAccessService.assertCanAccessProject` → reemplazado por `AuthorizationService.can` |
| Gestión de proyecto (mutación) | `ProjectAccessService.assertCanManageProject` → reemplazado por `AuthorizationService.can` |
| Asignación de evaluador | `EvaluationService.assertAssignedEvaluator` |
| Auto o admin (users) | `assertSelfOrAdmin` → reemplazado por `AuthorizationService.can` |
| Ownership (nft-actor, mecenas-nft-portfolio, nft-ownership-event) | `resource.userId === actor.userId` |
| ADMIN | `@Roles(UserRole.ADMIN)` |
| Catálogo público autenticado (D3) | `JwtAuthGuard` (sin `@Roles`) |
| Stub (D6) | `JwtAuthGuard` |
| Público (health) | `@Public()` |

---

## 7. Endpoints públicos (justificación)

| Endpoint | Justificación |
|---|---|
| `GET /health` | Health check estándar. No expone datos. |
| `GET /ready` | Readiness check. No expone datos. |
| `POST /auth/signin` | Login. |
| `POST /auth/signup` | Registro. |
| `POST /auth/google/exchange` | Intercambio de código OAuth. |
| `GET /auth/google`, `/callback` | Flujo OAuth de Google. |
| `POST /auth/forgot-password` | Recuperación de contraseña. |
| `POST /auth/reset-password` | Reset de contraseña. |
| `POST /auth/refresh` | Renovación de tokens. |
| `POST /auth/logout` | Logout. |

Todos los demás endpoints requieren autenticación.

---

## 8. Fuente de verdad para el frontend

El endpoint de sesión/perfil del backend debe devolver los **permisos efectivos** calculados por el backend, no solo el rol. Formato propuesto:

```json
{
  "user": {
    "id": "...",
    "email": "...",
    "role": "evaluator",
    "permissions": [
      "project:read:own",
      "project:manage:own",
      "evidence:read:assigned",
      "evaluation:approve:assigned",
      "catalog:read"
    ]
  }
}
```

El frontend consume `permissions[]` para adaptar la UI. Zustand se usa **solo** para presentar, nunca como fuente de verdad.
