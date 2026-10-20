# SEC-004 — Plan de rollback

**Fecha:** 2026-10-10
**Rama:** `dev`
**Commits incluidos:**
1. `feat(authz): add AuthorizationService and global auth guard`
2. `fix(authz): restore guards on tramos, projects, digital-credentials, mecenas`
3. `fix(authz): add role guards to catalogs and fix IDOR in nft resources`
4. `fix(authz): prevent cross-project data leaks in evaluations and reputation`
5. `feat(authz): EVALUATOR access by assignment instead of global`
6. `feat(authz): expose effective permissions in profile endpoint`
7. `test(authz): add e2e tests for SEC-004 negative authorization`
8. `test(authz): add regression test for endpoints without guard`

---

## 1. Rollback del backend

### 1.1 Revertir commits (orden inverso)

```bash
git revert --no-commit HEAD~8..HEAD
git commit -m "revert: SEC-004 authorization changes"
```

### 1.2 Eliminar archivos nuevos creados por SEC-004

```bash
rm -rf src/authorization/
rm -f test/QA/sec-004-negative-authorization.e2e-spec.ts
rm -f test/QA/sec-004-no-endpoint-without-guard.e2e-spec.ts
rm -f docs/security/authorization-matrix.md
```

### 1.3 Revertir cambios en archivos existentes

Los siguientes archivos fueron modificados por SEC-004 y deben revertirse a su estado anterior:

- `src/app.module.ts` (eliminar AuthorizationModule y APP_GUARD)
- `src/auth/auth.controller.ts` (eliminar @Public())
- `src/auth/auth.module.ts` (eliminar export de JwtAuthGuard)
- `src/users/users.service.ts` (revertir bumpSessionVersion y completeProfile)
- `src/users/users.controller.ts` (revertir permissions en profile)
- `src/projects/project-access.service.ts` (revertir D1)
- `src/projects/projects.controller.ts` (revertir guards)
- `src/projects/projects.service.ts` (revertir findAllAuthorized)
- `src/tramos/tramos.controller.ts` (revertir guard)
- `src/tramos/tramos.module.ts` (revertir forwardRef)
- `src/digital-credentials/digital-credentials.controller.ts`
- `src/digital-credentials/digital-credentials.module.ts`
- `src/mecenas-semilla/mecenas-semilla.controller.ts`
- `src/learning-resource/learning-resource.controller.ts`
- `src/curriculum/curriculum.controller.ts`
- `src/nfts/nft-actor/nft-actor.controller.ts`
- `src/nfts/nft-actor/nft-actor.service.ts`
- `src/nfts/mecenas-nft-portfolio/mecenas-nft-portfolio.controller.ts`
- `src/nfts/mecenas-nft-portfolio/mecenas-nft-portfolio.service.ts`
- `src/evaluation/evaluation.controller.ts`
- `src/reputation/reputation.controller.ts`
- `src/authorization-audit/entities/authorization-denial-audit.entity.ts`

---

## 2. Migraciones de BD

**No se requieren migraciones reversibles.** SEC-004 no agregó nuevas tablas ni columnas. Los cambios son exclusivamente a nivel de código (guards, validaciones, servicios).

---

## 3. Orden de despliegue

### 3.1 Rollback del backend
1. Revertir commits (ver 1.1)
2. Hacer build: `npm run build`
3. Desplegar backend
4. Verificar que los endpoints vuelven a su comportamiento anterior

### 3.2 Rollback del frontend
1. Revertir cambios en `client/src/lib/store.js` y componentes que consuman `permissions`
2. Desplegar frontend
3. Verificar que la UI funciona con el rol de Zustand (estado anterior)

---

## 4. Verificación tras rollback

- [ ] `GET /api/v1/projects` vuelve a ser público (sin auth)
- [ ] `POST /api/v1/tramos` vuelve a ser público (sin auth)
- [ ] `POST /api/v1/auth/complete-profile` acepta cualquier rol (incluyendo admin)
- [ ] `GET /api/v1/users/profile` no devuelve `permissions`
- [ ] Los endpoints de lectura (categories, pacs, etc.) vuelven a ser públicos

---

## 5. Notas adicionales

- Si se necesita revertir solo parcialmente, los commits están organizados por área (ver lista arriba).
- El test de regresión (`sec-004-no-endpoint-without-guard.e2e-spec.ts`) debe fallar después del rollback (esperado: confirma que los endpoints volvieron a estar sin guard).
