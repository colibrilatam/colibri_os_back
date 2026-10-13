# WEB3-002 — Firma de wallet con nonce (SIWE)

## Riesgo mitigado

Confiar únicamente en una dirección enviada por el navegador permite
suplantar wallets y reutilizar firmas antiguas. Este ticket exige un nonce
único con expiración, verificación completa del mensaje y de la firma, consumo
de un solo uso y vinculación de la sesión a la wallet validada.

## Estándar y librerías

- Mensajes **EIP-4361 (Sign-In With Ethereum / SIWE)**. El backend construye el
  mensaje completo; el cliente solo lo firma tal cual.
- Verificación de firma con `ethers` v6 (`verifyMessage`, EIP-191 `personal_sign`).
- Parseo y validación estructural del mensaje con `siwe` v3.
- Persistencia de nonces en PostgreSQL (`wallet_nonces`).

## Endpoints (`/api/v1/wallet-auth`)

| Método | Ruta | Auth | Propósito |
| --- | --- | --- | --- |
| POST | `/nonce` | público (throttle 20/min) | Emite nonce + mensaje SIWE para **login** |
| POST | `/verify` | público (throttle 20/min) | Verifica firma y abre sesión (cookie HttpOnly) |
| POST | `/link/nonce` | sesión JWT | Emite nonce + mensaje SIWE para **vincular** wallet |
| POST | `/link/verify` | sesión JWT | Verifica firma y vincula la wallet al usuario |
| DELETE | `/unlink` | sesión JWT | Desvincula la wallet y revoca las sesiones activas |

## Flujo de verificación (backend)

1. Parseo del mensaje SIWE (`siwe`). Si es inválido → 400.
2. `domain` **debe** coincidir con `WALLET_AUTH_DOMAIN` (fijado en backend).
3. `uri` **debe** coincidir con `WALLET_AUTH_URI`.
4. `chainId` **debe** estar en `WALLET_AUTH_CHAIN_IDS`.
5. `expirationTime` del mensaje no debe estar vencido.
6. **Consumo atómico del nonce**:
   `UPDATE wallet_nonces SET used_at = NOW() WHERE nonce = $1 AND purpose = $2
   AND used_at IS NULL AND expires_at > NOW() RETURNING id`.
   Si no devuelve fila → 401 (inexistente, expirado o ya usado). Un `UPDATE`
   condicional garantiza que gana un solo request ante concurrencia.
7. Para `link`, el `user_id` del nonce debe coincidir con el usuario autenticado.
8. El mensaje recibido **debe** ser byte a byte igual al persistido para ese nonce.
9. `ethers.verifyMessage(message, signature)` recupera la address firmante; debe
   coincidir con la `wallet_address` persistida (case-insensitive).

### Invariantes de la tabla `wallet_nonces`

- `nonce` es único (UUID-like, 32 bytes hex) y `purpose ∈ {login, link}`.
- `CHECK`: `purpose = 'link'` ⇒ `user_id NOT NULL`; `purpose = 'login'` ⇒ `user_id NULL`.
- Índice único parcial en `users.crypto_wallet` (`WHERE crypto_wallet IS NOT NULL`)
  para impedir que una misma wallet quede vinculada a dos cuentas.

## Criterios de aceptación — trazabilidad

| Criterio | Implementación |
| --- | --- |
| Nonce único y con expiración | `WalletAuthService.generateNonce` + `expires_at` |
| Backend verifica dirección, mensaje, dominio y firma | Pasos 2–4 y 8–9 del flujo |
| El nonce no puede reutilizarse | Consumo atómico (paso 6) |
| Sesión vinculada a la wallet validada | `/verify` setea cookie y `/link/verify` persiste `crypto_wallet` |

## Pruebas

- E2E: `test/web3-002-wallet-auth.e2e-spec.ts` (login, link, unlink y negativas:
  reuso, nonce expirado, firma de otra wallet, mensaje/dominio manipulados,
  chainId inválido, cruce login/link, concurrencia, wallet ya vinculada, unlink sin wallet).
- E2E throttle: `test/web3-002-wallet-auth-throttle.e2e-spec.ts`.
- Frontend (Vitest): `colibri_os_front/client/src/services/__tests__/walletAuth.test.js`.

## Deuda conocida — fuera de alcance MVP

Estas dos limitaciones son **decisiones conscientes de MVP**, no defectos
detectados en revisión. Se documentan para que una auditoría futura no las
vuelva a levantar como hallazgos nuevos.

1. **Limpieza de `wallet_nonces` (no implementada).** No existe job/cron que
   purgue filas consumidas (`used_at IS NOT NULL`) ni expiradas
   (`expires_at < NOW()`), por lo que la tabla crece sin techo. El índice
   parcial `IDX_wallet_nonces_expires_at` acelera las consultas, pero no borra
   nada. Mitigación propuesta: `@Cron(CronExpression.EVERY_HOUR)` que ejecute
   `DELETE FROM wallet_nonces WHERE used_at IS NOT NULL OR expires_at < NOW() - interval '1 hour'`.
   Riesgo mientras no exista: degradación gradual del rendimiento de
   inserción/búsqueda por volumen. Aceptable con el volumen actual del piloto.

2. **Rate limit solo por IP (no por wallet).** El `ThrottlerGuard` global usa
   `req.ip` como tracker (no hay `getTracker` propio). Límites aplicados:
   20/min por ruta en `wallet-auth`; `/unlink` cae al límite global (100/min).
   Consecuencias: (a) un atacante con múltiples IPs puede intentar nonces
   contra una wallet concreta; (b) una IP compartida (NAT) puede agotar el cupo
   y afectar a usuarios legítimos. Mitigación propuesta: tracker combinado
   `ip + walletAddress` en `/nonce` y `/link/nonce`. Riesgo acotado: el nonce
   es de un solo uso y la firma se verifica criptográficamente, por lo que el
   throttle es fricción y no el control de seguridad principal.

## Plan de rollback

1. **Feature**: el módulo `WalletAuthModule` es independiente; quitar su
   importación en `app.module.ts` deshabilita todos los endpoints sin afectar
   login/Google/email.
2. **Base de datos**: revertir la última migración
   (`npm run migration:revert`) elimina `wallet_nonces` y el índice único de
   `users.crypto_wallet`. Luego revertir `1700000013000` revierte el valor
   `wallet` del enum `users_provider_enum`.
3. **Frontend**: revertir el PR de `WalletConnect` / `walletAuth` y su
   integración en `/login` e identidad.
4. Los usuarios creados vía wallet (`provider = 'wallet'`) quedan con
   `crypto_wallet` persistida; no se eliminan datos de usuario en el rollback.
