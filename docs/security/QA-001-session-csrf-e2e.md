# QA-001 — Sesión, CSRF y revocación (cambios de backend)

**Ticket:** QA-001 (Sprint 1) · **Áreas:** Auth, Autorización, Sesión, CI
**Estado:** implementado y verificado en CI. **Rama:** `dev`.
**Evidencia CI:** [PR #173](https://github.com/colibrilatam/colibri_os_back/pull/173)
(head `b6e8084`) — CodeQL en verde. El PR es solo evidencia de CI; el código
vive en `dev` (no se mergea a `main`).

Este documento registra los cambios de backend introducidos por QA-001 como
soporte de la suite Playwright (repo `colibri_os_front/e2e`) y las decisiones
de seguridad asociadas.

---

## 1. CSRF double-submit cookie (expansión de alcance sobre SEC-003)

**Contexto.** SEC-003 exige "protección CSRF para operaciones sensibles", pero
el código mergeado solo mitigaba con `SameSite` + allowlist de CORS + `state`
OAuth. No existía un token CSRF formal. QA-001 agrega un **doble submit**
explícito.

**Implementación:**

- `src/auth/cookie.helper.ts`
  - Al crear sesión (`setAuthCookie`) se emite una cookie **`csrf_token`** NO
    HttpOnly, `SameSite` (prod: `None`; dev/test: `Lax`), `Secure` en prod,
    `path=/`. El valor es aleatorio (32 bytes).
  - `clearAuthCookie` limpia ambas cookies (`colibri_access_token` y `csrf_token`).
- `src/auth/guards/csrf.guard.ts` (registrado como `APP_GUARD`)
  - Aplica a métodos mutantes (`POST/PUT/PATCH/DELETE`).
  - Exige que el header `X-CSRF-Token` coincida **exactamente** con la cookie
    `csrf_token`; si falta o no coincide → **403**.
  - **Solo aplica a requests basadas en cookie.** Si la request trae
    `Authorization: Bearer`, se omite (un atacante cross-site no puede fijar
    headers; los tests Jest e2e existentes usan Bearer y no se rompen).
  - Si no hay cookie de sesión, se omite (lo resuelve `JwtAuthGuard` con 401).
  - Rutas excluidas (pre/post sesión): `signin`, `signup`, `demo-login`,
    `refresh`, `complete-profile`, `forgot-password`, `reset-password`,
    `google`, `google/callback`, `google/exchange`, `health`, `ready`.
- Frontend: `client/src/lib/api/csrf.js` lee `csrf_token` y añade
  `X-CSRF-Token` en requests mutantes (integrado en el interceptor de
  `client.js`). Test unitario: `client/src/lib/api/__tests__/csrf.test.js`.

**Por qué es seguro:** el token vive en una cookie legible por JS *solo* para el
mismo origen. Un sitio atacante no puede leer esa cookie (Same-Origin Policy) ni
establecer un header custom en una request forjada, por lo que no puede
completar el doble submit.

**Cobertura E2E:** `e2e/tests/security/csrf.spec.ts` (T-16).

---

## 2. Logout con revocación real (bump de `sessionVersion`)

**Contexto.** Antes, `POST /auth/logout` solo limpiaba la cookie. Un JWT
capturado antes del logout seguía siendo válido hasta expirar (gap R2 de
CODE-006). La prueba negativa N3 ("reutilizar una sesión cerrada") no podía
demostrarse.

**Implementación:**

- `AuthService.revokeSessionFromToken(token, refreshToken?)`
  - Verifica el JWT de sesión (`cookie` o `Authorization: Bearer`), obtiene
    `sub` e incrementa `sessionVersion` vía `SessionsService.bumpSessionVersion`.
  - Si además se envía `refreshToken` en el body (`LogoutDto`), lo revoca.
  - Es **idempotente**: token inválido/expirado o usuario inexistente → igual se
    limpia la cookie y se responde 200.
- `AuthController.logout` extrae el token con `extractTokenFromRequest` y llama
  al servicio.

**Comportamiento global (decisión aceptada y documentada):** cerrar sesión
incrementa la versión de sesión del usuario e invalida **todas** sus sesiones
activas, no solo el dispositivo que cierra sesión. Cualquier access token
emitido antes responde **401** de inmediato.

**Cobertura:**
- Jest e2e: `test/QA/iam-001-session-revocation.e2e-spec.ts` (logout revoca JWT
  y refresh; idempotente).
- Playwright: `e2e/tests/04-expiry-revocation.spec.ts` (T-14, T-20, T-15).

---

## 3. Fixes de accesibilidad de endpoints (necesarios para el flujo real)

Al montar el entorno E2E aparecieron dos endpoints inaccesibles por el
`JwtAuthGuard` global (deny-by-default), contra lo documentado:

1. **`GET /health` y `GET /ready`** respondían **401**. Debían ser públicos
   (`docs/security/authorization-matrix.md` §4.25 y §7). Se añadió `@Public()`
   a `HealthController`. Esto también repara los health checks de
   infraestructura y el smoke test de CI.
2. **`POST /auth/complete-profile`** respondía **401**, pero es el endpoint que
   usa un usuario `PENDING_PROFILE` (sin sesión todavía) para completar su
   perfil tras el login con Google. Se añadió `@Public()`; su autorización real
   es el `profileCompletionToken` (JWT con `purpose='profile-completion'`)
   verificado en el servicio, más la whitelist de roles auto-asignables
   (`SEC-002/B1`). Sin esto, el flujo OAuth de usuario nuevo nunca completaba.

---

## 4. Fake OAuth provider para E2E

- `src/auth/google/google-fake.strategy.ts`, habilitado por
  `E2E_OAUTH_FAKE=true` (nunca en dev/prod).
- Registrado condicionalmente en `AuthModule` (reemplaza a `GoogleStrategy`
  bajo el mismo nombre passport `google`).
- Simula Authorization Code: `/auth/google` fija la cookie de `state` y redirige
  al callback; el callback valida el `state` (un solo uso) y produce un perfil
  Google sintético. Permite `?fake_email=` para probar usuario nuevo vs
  existente.

---

## 5. Throttling en entorno de tests

Los límites de `@Throttle` (5/min en signin, etc.) rompían la suite Playwright
(decenas de logins desde la misma IP). `src/common/throttle.util.ts`
(`throttleLimit`) relaja el límite **solo** cuando `E2E_RELAX_THROTTLE=true`
(definido por `docker-compose.e2e.yml` y por el workflow `e2e.yml` del frontend).
Los tests Jest e2e (`NODE_ENV=test` sin esa variable) conservan el rate limiting
real: varias suites (OPS-003, QA-002) lo verifican explícitamente.

---

## 6. Variables de entorno nuevas

| Variable             | Uso                                                                       |
|----------------------|---------------------------------------------------------------------------|
| `E2E_OAUTH_FAKE`     | `true` activa el provider OAuth falso (solo E2E).                         |
| `E2E_RELAX_THROTTLE` | `true` relaja el rate limiting para la suite Playwright (solo E2E).       |

Validada en `src/config/env.validation.ts` (booleano opcional).

---

## 7. Seeder E2E (solo test)

- `src/database/seeds/seed-e2e.ts` + script `npm run seed:e2e`.
- **Gate `NODE_ENV=test`**: aborta en cualquier otro entorno.
- Trunca todas las tablas públicas (menos `migrations`) y siembra un dataset
  mínimo: usuarios por rol (admin, entrepreneur A/B, evaluator, mentor, guest,
  usuario de revocación y un usuario Google activo), proyectos A/B, evidencia y
  evaluación por proyecto, membresías y asignación del evaluador a A.
- NO reemplaza a `seed.ts` (demo). Es exclusivo del entorno E2E.

---

## 8. Mitigación de alertas CodeQL (High) detectadas en el CI del PR

El análisis SAST de CodeQL sobre el PR detectó **2 alertas High** introducidas
por los cambios de QA-001. Se corrigieron en dos rondas (commits `ea25d16` y
`b6e8084`).

**Alerta 1 — `User-controlled bypass of security check`
(`src/auth/auth.service.ts`, `revokeSessionFromToken`).**
La condición `if (rawToken)` (valor controlado por el usuario) guardaba la
verificación del JWT — CodeQL la lee como un bypass del check de seguridad.
Corregido: `jwtService.verify(rawToken ?? '')` se intenta **siempre**; sin
token válido `verify` lanza y cae al `catch`. Mismo comportamiento observable
(idempotente: sin token no hay sesión que revocar).

**Alerta 2 — `Remote property injection`
(`src/auth/guards/csrf.guard.ts`, parseo de cookies).**
El parser construía un objeto con llaves extraídas del header `Cookie`
(controlado por el usuario). Primero se mitigó con `Object.create(null)` +
denylist (`__proto__`/`constructor`), pero CodeQL **no acepta denylist**: exige
*allowlist*. Corregido de forma estructural: `extractSessionCookies()` extrae
**solo las dos cookies fijas** que el guard necesita (`csrf_token` y
`colibri_access_token`); el nombre de la cookie nunca se usa como llave de
escritura — se compara contra constantes y se asigna a variables conocidas.

**Hardening complementario (no era alerta CodeQL, se mantiene por defense in
depth):** `DEMO_ACCOUNT_EMAILS` en `AuthService` pasó de objeto indexable a
`Map` + guard `!email` → 401 (evita indexación con llaves hostiles en
`demoLogin`).

**Tests de regresión de la mitigación:**
- `src/auth/auth.service.spec.ts` — `demoLogin('investor' as any)` y
  `demoLogin('__proto__' as any)` → `UnauthorizedException` sin tocar la DB.
- `src/auth/guards/csrf.guard.spec.ts` — header
  `__proto__=polluted; constructor=evil` → 403 y `Object.prototype` no
  contaminado.

---

## 9. Evidencia CI (PR #173, head `b6e8084`)

| Workflow / check | Resultado | Link |
|---|---|---|
| **CodeQL (SAST)** — *"No new alerts in code changed by this pull request"* | ✅ success | [run](https://github.com/colibrilatam/colibri_os_back/runs/117533826156) |
| Analyze (javascript-typescript) | ✅ success | [job](https://github.com/colibrilatam/colibri_os_back/actions/runs/39079579125/job/117533610251) |
| CI Negative Tests (gate CI-001: lint/unit/authorization/migration) | ✅ success | [run](https://github.com/colibrilatam/colibri_os_back/actions/runs/39079578937) |
| Contracts | ✅ success | [run](https://github.com/colibrilatam/colibri_os_back/actions/runs/39079578921) |
| Secret Scanning (Gitleaks) | ✅ success | [run](https://github.com/colibrilatam/colibri_os_back/actions/runs/39079578943) |
| SCA — OSV-Scanner / Dependency Review | ⚠️ failure (**preexistente**, ajeno a QA-001) | [run](https://github.com/colibrilatam/colibri_os_back/actions/runs/39079578974) |

Verificación local adicional (corrida del fix):
- Jest unitario: **67/67** en verde.
- Jest e2e (DB temporal con migraciones): **79/79** en las suites de
  logout/revocación (`iam-001`), demo-login (`sec-002-escalation-regression`,
  `sec-002-legacy-credentials`) y auditoría (`qa-auditoria`).

---

## 10. Fix del Backend CI (`ci-gate` roto desde 2026-08-25)

**Hallazgo durante la verificación de QA-001.** El job `ci-gate` de
`.github/workflows/main.yml` declaraba
`needs: [..., sca-gate, sast-gate, secret-scan-gate]`, pero esos tres jobs ya
no existían en el workflow (los checks viven ahora en `sca.yml`, `codeql.yml`
y `secret-scanning.yml`). GitHub Actions no puede construir un grafo con
`needs` a jobs inexistentes: **todo el workflow fallaba al arrancar** (runs de
0 segundos, 0 jobs, `conclusion=failure`) en cada push y cada PR. Esto venía
pasando desde el commit `b7b04f2` (2026-08-25), previo a QA-001.

**Fix:** el `ci-gate` usa solo los jobs internos que sí existen:
`needs: [lint-and-build, unit-tests, e2e-tests, build-artifact]`.
