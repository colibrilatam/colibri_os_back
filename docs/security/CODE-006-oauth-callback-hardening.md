# CODE-006 — Eliminación de tokens en URL durante el callback de Google OAuth

## Metadata

| Campo | Valor |
|---|---|
| Ticket | CODE-006 |
| Estado | Mergeado a `dev` (backend y frontend). Pendiente QA antes de `main`. |
| Fecha de implementación | 2026-10-05 |
| Owner | SEC |
| Áreas afectadas | Auth, Google OAuth, sesión HttpOnly, contratos |
| Repos | `colibri_os_back`, `colibri_os_front` |

## Resumen ejecutivo

El flujo de callback de Google OAuth exponía tokens (JWT `tempToken`, `role`) en la query string de la URL de redirección. Esto dejaba secretos en el historial del navegador, logs del servidor, referers y herramientas de depuración. La solución reemplaza el JWT en URL por un **código opaco de un solo uso** (`code`) que el frontend canjea vía `POST /auth/google/exchange`. El backend emite la cookie de sesión `colibri_access_token` (`HttpOnly`, `Secure`, `SameSite`) solo en el exchange, nunca en el callback. Para usuarios nuevos (`PENDING_PROFILE`), se emite un `profileCompletionToken` (JWT firmado con `purpose: 'profile-completion'`, 1h) que vive **solo en memoria** del componente React, sin persistir en `localStorage`/`sessionStorage`. El frontend limpia la URL con `history.replaceState` **antes** de cualquier llamada async. Se agregaron `Referrer-Policy` específicos y sanitización de query strings en logs de desarrollo.

## Problema

- **Vector**: JWT en query string (`?tempToken=<jwt>&role=<rol>`) durante `GET /auth/google/callback`.
- **Impacto**: tokens en historial del navegador, logs de acceso, `Referer` headers, herramientas de terceros.
- **Bug previo**: Race condition en `googleLogin` (ver `docs/Google_Login_Problem.md` — marcado **RESUELTO** en CODE-006) que retornaba `tempToken: undefined`.
- **Criterios de aceptación originales (4)**:
  1. Ningún token (JWT, `tempToken`, `role`) aparece en la URL.
  2. El callback intercambia un código de un solo uso.
  3. El perfil y los permisos se cargan desde sesión validada (cookie HttpOnly).
  4. La redirección final existe y no contiene secretos.

## Solución

### Flujo anterior

1. `GET /auth/google/callback` → backend setea cookie **y** redirige con `?tempToken=<jwt>&role=<rol>`.
2. Frontend lee `tempToken` de la URL, lo guarda, redirige según rol.

### Flujo nuevo

1. `GET /auth/google/callback` → backend resuelve usuario, emite `code` opaco single-use vía `OAuthExchangeService.issue`, redirige con **solo** `?code=<opaco>`. Sin cookie, sin token, sin rol.
2. Frontend (`/login/google-callback`): limpieza inmediata de URL con `history.replaceState` **antes** de cualquier POST.
3. Frontend hace `POST /auth/google/exchange { code }`.
4. Backend (`OAuthExchangeService.consume`) valida single-use:
   - Si usuario `ACTIVE` → setea `colibri_access_token` HttpOnly vía `setAuthCookie`, responde `{ user, requiresProfileCompletion: false }`.
   - Si usuario `PENDING_PROFILE` → responde `{ user, requiresProfileCompletion: true, profileCompletionToken }` (JWT firmado con `purpose: 'profile-completion'`, 1h). Token **solo en memoria** del componente.
5. Si `PENDING_PROFILE`, el frontend muestra form, envía `POST /auth/complete-profile { profileCompletionToken, role, gender }`, backend setea cookie y responde user final.

### Propiedades de seguridad resultantes

- El `code` es opaco, single-use, expira (default 60s, configurable via `OAUTH_EXCHANGE_CODE_TTL_MS`).
- No viaja ningún JWT en URL, referer, historial ni logs.
- La cookie de sesión es `HttpOnly` + `Secure` + `SameSite` (prod: `None`; dev: `Lax`).
- `profileCompletionToken` vive solo en memoria del componente (no `localStorage`, no `sessionStorage`).
- `Referrer-Policy: no-referrer` en `/login/google-callback`; `strict-origin-when-cross-origin` en el resto del sitio.
- Logger del frontend sanitiza query strings (`stripQuery`) en desarrollo.
- Frontend ya no escribe cookies de sesión desde JS (eliminado `setToken`, `clearToken`, `deleteCookie('token')`, `isAuthenticated` del store).
- `state` anti-CSRF validado en `GoogleStrategy` vía `OAuthStateStore` (cookie HttpOnly one-time).

## Cambios por fase

| Fase | Alcance | Componentes clave |
|---|---|---|
| 1 | Contratos | `GoogleExchangeResponseDto`, rename de schemas, `npm run contract:sync` |
| 2 | Backend funcional | `auth.service.ts`, `auth.controller.ts`, DTOs |
| 3 | Tests backend | unit + e2e `code-006-*` |
| 3.5 | Fix crítico | `OAuthExchangeService.consume` acepta `PENDING_PROFILE` |
| 4 | Frontend funcional | `authService.js`, `google-callback/page.jsx`, `useCompleteProfile.js` |
| 5 | Limpieza frontend | `store.js`, `token.js`, `logger.js`, `next.config.mjs` |
| 6 | Test seguridad frontend | `oauth-url-hygiene.security.test.jsx` |
| 7 | Docs | `exceptions-log.md`, `permissions-matrix.md`, `Google_Login_Problem.md` |
| 8 | Deploy | Mergeado a `dev`. QA → `main` pendiente. |

## Archivos modificados / creados

### Backend (`colibri_os_back`)

**Nuevos:**
- `src/auth/dto/google-exchange-response.dto.ts`
- `src/auth/dto/complete-profile.dto.ts`
- `src/auth/oauth/oauth-exchange.service.ts`
- `src/auth/oauth/oauth-exchange-code.entity.ts`
- `src/auth/oauth/oauth-exchange.service.spec.ts`
- `test/QA/code-006-oauth-callback.e2e-spec.ts`
- `test/QA/code-006-oauth-exchange.e2e-spec.ts`
- `test/QA/code-006-oauth-state.e2e-spec.ts`

**Modificados:**
- `src/auth/auth.service.ts` — `googleLogin` con retry de race condition, `issueProfileCompletionToken`, `completeProfile`
- `src/auth/auth.controller.ts` — `getGoogleCallback` (solo `code`), `exchangeGoogleCode`, `completeProfile`
- `src/auth/auth.service.spec.ts` — 13 tests (race condition, purpose, completeProfile)
- `src/auth/auth.controller.spec.ts` — 4 tests (redirect solo `code`, exchange ACTIVE/PENDING)
- `src/auth/dto/complete-profile-response.dto.ts`
- `src/auth/dto/auth-response.dto.ts` (ajustes)
- `src/auth/cookie.helper.ts` (setAuthCookie / clearAuthCookie)
- `packages/contracts/src/generated/schemas.ts` — schemas Zod generados
- `packages/contracts/src/openapi.json` — OpenAPI exportado
- `docs/security/exceptions-log.md` — excepción PKCE
- `docs/security/permissions-matrix.md` — filas `auth` actualizadas
- `docs/Google_Login_Problem.md` — bloque RESUELTO al inicio

### Frontend (`colibri_os_front/client`)

**Nuevos:**
- `src/tests/auth/oauth-url-hygiene.security.test.jsx` — 9 tests

**Modificados:**
- `src/app/login/google-callback/page.jsx` — reescritura completa: lee `code`, limpia URL, exchange, formulario PENDING_PROFILE
- `src/services/authService.js` — `exchangeGoogleCode`, `completeProfile` actualizado
- `src/hooks/mutations/useCompleteProfile.js` — comment actualizado
- `src/hooks/useLogin.js` — eliminado `setToken`
- `src/hooks/mutations/useLogin.js` — eliminado `setToken`
- `src/lib/store.js` — eliminado `token`, `setToken`, `getToken`, `isAuthenticated`, `deleteCookie('token')`; comentario R3
- `src/lib/api/token.js` — solo `getToken` (lectura SSR)
- `src/lib/api/index.js` — export solo `getToken`
- `src/lib/api/logger.js` — `stripQuery` helper aplicado a `logRequest`, `logResponse`, `logError`
- `next.config.mjs` — `headers()` con `Referrer-Policy`
- `src/lib/contracts/generated/schemas.ts` — sincronizado

### Contratos

- `packages/contracts/scripts/generate-zod.ts`
- `packages/contracts/src/generated/schemas.ts`
- `packages/contracts/src/openapi.json`

## Tests

### Backend

| Archivo | Tests activos | Tests skipped | Comentario |
|---|---|---|---|
| `src/auth/auth.service.spec.ts` | 13 | 0 | googleLogin (5), issueProfileCompletionToken (1), toPublicUser (1), buildAuthResult (1), completeProfile (4), race condition |
| `src/auth/auth.controller.spec.ts` | 4 | 0 | getGoogleCallback (2), exchangeGoogleCode (2) |
| `src/auth/oauth/oauth-exchange.service.spec.ts` | 9 | 0 | issue, consume (ACTIVE, PENDING_PROFILE), replay, expirado, inexistente, SUSPENDED, INACTIVE |
| `test/QA/code-006-oauth-callback.e2e-spec.ts` | 4 | 0 | callback nuevo usuario, sin cookie, code válido → exchange, replay |
| `test/QA/code-006-oauth-exchange.e2e-spec.ts` | 3 | 3 | ACTIVE con cookie, PENDING_PROFILE sin cookie, replay; **skipped**: expirado, inactivo/suspendido, rate limit (throttling no configurable en tests) |
| `test/QA/code-006-oauth-state.e2e-spec.ts` | 1 | 3 | state cookie HttpOnly; **skipped**: validaciones de state en strategy (requieren flow real) |

**Total backend**: 34 tests activos, 6 skipped (documentados con `// SKIP:` y razón).

### Frontend

| Archivo | Tests | Estado |
|---|---|---|
| `client/src/tests/auth/oauth-url-hygiene.security.test.jsx` | 9 | ✅ Todos pasan |

**Detalle de los 9 tests frontend:**

| # | Test | Qué verifica |
|---|---|---|
| 1 | Limpieza de URL antes de llamar a `exchangeGoogleCode` | `history.replaceState` se llama **antes** que `exchangeGoogleCode` (orden verificado con array de eventos) |
| 2 | Invoca `exchangeGoogleCode` con el code correcto | Llamado 1 vez con `abc123` |
| 3 | No persiste nada en localStorage/sessionStorage tras mount+flush | Ambos storages length = 0 |
| 4 | No deja el code en cookies accesibles | `document.cookie` no contiene el code |
| 5 | No deja el code en `window.location` tras limpieza | `window.location.search` no contiene el code |
| 6 | Redirige a error si falta `?code` | `router.replace('/login?error=google_failed')`, `exchangeGoogleCode` no llamado |
| 7 | Redirige a error si el exchange rechaza | Mock rejected → mismo redirect |
| 8 | `profileCompletionToken` vive solo en memoria, no en storage | Form se renderiza; storages no contienen `pct-xyz` ni `profileCompletionToken` |
| 9 | No procesa `tempToken` ni `role` desde URL (solo `code`) | `?tempToken=leaked&role=admin` → redirect error, `exchangeGoogleCode` no llamado |

### Cómo correrlos

```bash
# Backend (desde colibri_os_back)
npm run test
npm run test:e2e -- code-006

# Frontend (desde colibri_os_front/client)
npm run test:run -- oauth-url-hygiene
```

## Criterios de aceptación — verificación

| Criterio | Evidencia | Estado |
|---|---|---|
| 1. Sin tokens en URL | `auth.controller.ts:66` redirect solo `code`; `auth.controller.spec.ts:51` test `expect([...redirectUrl.searchParams.keys()]).toEqual(['code'])` | ✅ |
| 2. Callback usa code single-use | `OAuthExchangeService.issue`/`consume`; `oauth-exchange.service.spec.ts` 9 tests; e2e replay tests | ✅ |
| 3. Perfil/permisos desde sesión HttpOnly | `setAuthCookie` en `exchangeGoogleCode` y `completeProfile`; cookie `HttpOnly`/`Secure`/`SameSite`; frontend elimina `setToken`/`clearToken` | ✅ |
| 4. Redirect final sin secretos | `exchangeGoogleCode` response sin `token` ni `profileCompletionToken` en body para ACTIVE; frontend `redirectByRole` usa `user.role` del body | ✅ |

## Excepción documentada

- **PKCE (RFC 7636) no implementado**. Justificación: cliente confidencial (RFC 6749 §2.3.1); el backend custodia `GOOGLE_CLIENT_SECRET` y no hay `code_verifier` viajando por el browser. Mitigación: `state` anti-CSRF con cookie HttpOnly + exchange code single-use + cookie de sesión HttpOnly/Secure/SameSite. Expira 2027-01-03. Ver `docs/security/exceptions-log.md`.

## Gaps conocidos (fuera de scope)

- **R1**: `POST /auth/refresh` recibe `refreshToken` en body, pero ni `login`, ni `signup`, ni `exchange` emiten refresh token en la respuesta. Gap pre-existente, no tocado en CODE-006.
- **R2**: `POST /auth/logout` limpia cookie pero no revoca refresh token en DB (el `SessionsService.revokeRefreshToken` existe pero el controller no lo usa con el token del body). Gap pre-existente.
- **R3**: `store.js` persiste todo el estado excepto `sidebarMobileOpen` (`partialize` excluye solo eso). Comentario in-code agregado para no agregar `profileCompletionToken` al store en el futuro.

## Rollout

- **Orden**: Backend primero, frontend después (el frontend nuevo necesita `/auth/google/exchange`).
- **Variables de entorno en Render** (a confirmar antes de `main`):
  - `FRONTEND_URL` sin trailing slash
  - `GOOGLE_CALLBACK_URL` apuntando a prod
  - `NODE_ENV=production`
  - `OAUTH_EXCHANGE_CODE_TTL_MS` (default 60s)
- **Google Cloud Console**: Authorized redirect URI debe incluir el callback de prod.
- **Rollback**: revertir backend restauraría el callback viejo con `?tempToken=`; el frontend de `dev` no lo maneja. Requiere revertir ambos en ventana corta.

## Referencias

- `docs/Google_Login_Problem.md` — race condition resuelta.
- `docs/security/exceptions-log.md` — excepción PKCE.
- `docs/security/permissions-matrix.md` — filas de `auth` actualizadas.
- Commits backend:
  - `f5a50cf` feat(contracts): agregar schemas Zod para POST /auth/google/exchange [CODE-006]
  - `ee64eac` feat(auth): eliminar tempToken de URL en callback Google OAuth [CODE-006]
  - `574dd33` test(code-006): agregar cobertura de callback, exchange y state OAuth [CODE-006]
  - `5761941` fix(code-006): permitir PENDING_PROFILE en OAuthExchangeService.consume [CODE-006]
- Commits frontend:
  - `362806b` feat(contracts): agregar schemas Zod para POST /auth/google/exchange [CODE-006]
  - `e49fa69` fix: adaptar la página de google callback para recibir code y no token temporal
  - `0a9e27f` fix: limpiar manejo de token, ahora se usa cookie httpOnly
  - `6bd997d` fix: limpiar referencias a token
  - `7e5f8ac` test(auth): add oauth url hygiene security test