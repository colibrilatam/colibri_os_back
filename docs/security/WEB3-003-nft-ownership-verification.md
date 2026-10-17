# WEB3-003 — Verificación de propiedad NFT on-chain

## Riesgo mitigado

Sin lectura de contrato y red, la aplicación no puede demostrar que la wallet
conectada posee realmente el NFT indicado. Este ticket exige consultar el RPC,
validar `chainId`, contrato, `tokenId`, propietario y bloque, y persistir el
resultado con trazabilidad.

## Alcance

> **WEB3-003 cubre únicamente ERC-721 (`ownerOf(uint256)`).**
> ERC-1155 (`balanceOf`) queda explícitamente fuera de alcance y se atiende en
> ticket aparte.

La wallet verificada es la **vinculada a la sesión** (`users.crypto_wallet`),
resuelta por `userId` desde el JWT (dependencia: WEB3-002). No se acepta una
dirección enviada por el navegador.

## Endpoint

| Método | Ruta | Auth | Throttle |
| --- | --- | --- | --- |
| POST | `/api/v1/nft-projects/:id/verify-ownership` | sesión JWT (`JwtAuthGuard`) | 20/min por **usuario** |

- `:id` es el `NftProject` (no tiene body). Se valida con `ParseUUIDPipe`.
- Respuesta 200: `{ owned, status, chainId, contractAddress, tokenId,
  walletAddress, ownerAddress, blockNumber, blockHash, blockTimestamp,
  checkedAt, validationError }`.
- **Rate limit por usuario, no por IP.** El `ThrottlerGuard` global corre
  **antes** de `JwtAuthGuard`, por lo que ahí `request.user` no existe; y
  reordenar los `APP_GUARD` rompería rutas que dependen del throttle previo a
  la autenticación (p. ej. `ops-003-mecenas-throttle`). Por eso el endpoint
  usa `@SkipThrottle()` (desactiva el throttle global solo aquí) y aplica
  `NftOwnershipThrottleGuard` como guard **de ruta**: al ejecutarse después de
  los guards globales, dispone de `request.user.sub` ya validado por
  `JwtAuthGuard`. Reutiliza el `ThrottlerStorage` del módulo global; **no**
  parsea ni verifica tokens.

## Flujo de verificación (backend)

1. Cargar el usuario de la sesión. Sin `crypto_wallet` → **409** (no toca el RPC).
2. Cargar el `NftProject`. Inexistente → **404**.
3. Validar configuración: `chainId > 0`, contrato ≠ `pending_blockchain`,
   `tokenId` parseable como `uint256` → si no, **409**.
4. `eth_chainId(chainId)` debe coincidir con el `chainId` del NFT. Si no →
   **200 `invalid`**.
5. `eth_getCode(contrato)` no vacío. Si `0x` → **200 `invalid`**.
6. Pinnear el bloque: `eth_blockNumber` → `blockTag`.
7. `eth_call ownerOf(tokenId)` en `blockTag`:
   - resultado vacío/`0x`/zero address → **200 `invalid`**;
   - revert (código `3` o mensaje `/revert/i`) → **200 `invalid`**;
   - cualquier otro error RPC → **503 `unavailable`**.
8. `eth_getBlockByNumber(blockTag)` → `blockHash` + `blockTimestamp`.
   Si falla → **503 `unavailable`** (decisión consciente: sin bloque no hay
   trazabilidad completa, ver comentario en el servicio).
9. Comparar (case-insensitive) `ownerOf` contra la wallet de la sesión →
   **200 `verified`** u **200 `not_owner`**.

## Clasificación revert vs. fallo de infraestructura

`RpcCallRevertedError` (en `blockchain-rpc.service.ts`) se lanza **solo** si:

- `error.code === 3`, **o**
- el mensaje matchea `/revert/i`, **o**
- `error.code === -32015` **y** el mensaje contiene `/execution|VM/i`.

`-32000` **nunca** alcanza por sí solo: es el código genérico de Geth y también
se usa para `header not found`, `block not found`, `insufficient funds`, etc.
Un `{-32000, "header not found"}` se trata como fallo de infraestructura → 503.

## Matriz de respuestas

| Situación | HTTP | `status` |
| --- | --- | --- |
| Wallet posee el NFT | 200 | `verified` |
| Wallet **no** posee el NFT | 200 | `not_owner` |
| Red distinta / sin contrato / token inexistente / revert | 200 | `invalid` |
| Config NFT inválida o usuario sin wallet | 409 | — |
| Fallo de infraestructura RPC | 503 | `unavailable` |
| NFT inexistente | 404 | — |
| Sin sesión | 401 | — |

Los errores RPC **nunca** se presentan como verificación correcta: se registran
con `status = unavailable` + `rpc_error` y responden 503.

## Persistencia — `nft_ownership_verifications`

Registro append-only (migración `1700000015000-CreateNftOwnershipVerifications`):

| Columna | Nota |
| --- | --- |
| `nft_project_id` | UUID, FK a `nft_projects` `ON DELETE SET NULL` (sobrevive al borrado) |
| `chain_id`, `contract_address`, `token_id` | red/contrato/token verificados |
| `wallet_address`, `owner_address` | normalizadas a minúsculas |
| `status` | `verified` / `not_owner` / `invalid` / `unavailable` |
| `block_number`, `block_hash`, `block_timestamp` | bloque pinneado de la lectura |
| `rpc_error`, `validation_error` | detalle de fallo de infra / resultado negativo |
| `checked_at`, `created_at` | `checked_at` seteado por el servicio en todos los caminos |

Índices: `chain_id`, `wallet_address`, `(nft_project_id, checked_at)`.

## Criterios de aceptación — trazabilidad

| Criterio | Implementación |
| --- | --- |
| La propiedad se valida contra la red y contrato configurados | Pasos 4–7 del flujo |
| Se registra chainId, contrato, tokenId, bloque y timestamp | `nft_ownership_verifications` |
| Una wallet sin el activo recibe un resultado negativo | Paso 9 → `not_owner` (200) |
| Los errores RPC no se presentan como verificaciones correctas | Revert ≠ infra; infra → 503 `unavailable` |

## Pruebas

E2E: `test/web3-003-nft-ownership-verification.e2e-spec.ts` (usa
`BlockchainRpcService` real y mockea `global.fetch`, para ejercitar la
clasificación revert/infra de verdad):

- Positivo `verified` con bloque/timestamp persistidos.
- Negativas del ticket: wallet sin el NFT (`not_owner`), red distinta y
  contrato sin código (`invalid`), transferencia del NFT y re-verificación.
- **Obligatorio**: `eth_call {-32000, "header not found"}` → 503 + fila
  `unavailable`.
- `eth_call` revert (código 3) → 200 `invalid`.
- Fallo de transporte en `eth_chainId` → 503.
- NFT inexistente → 404; usuario sin wallet → 409 (verificado con spy de que
  no se llamó al RPC); `chainId 0` → 409; sin sesión → 401.
- Rate limit por usuario: 21 requests del mismo usuario → 429; un segundo
  usuario desde la misma IP **no** comparte la cuota (prueba que el throttle
  global por IP está desactivado en este endpoint).

## Variables de entorno

Reutiliza las existentes: `BLOCKCHAIN_RPC_URLS`, `BLOCKCHAIN_CONFIRMATIONS`,
`BLOCKCHAIN_DEFAULT_CONFIRMATIONS`. No agrega variables nuevas.

## Fuera de alcance

- ERC-1155 (`balanceOf`). Ticket aparte.
- Frontend: el componente `NftLink.jsx` sigue siendo un stub simulado. La
  integración en el flujo de mecenas se atiende en un ticket FE aparte.

## Plan de rollback

1. **Código**: el endpoint vive en `NftProjectController` y el servicio en
   `NftsModule`; quitar el handler y el provider deja el resto intacto.
2. **Base de datos**: `npm run migration:revert` elimina
   `nft_ownership_verifications` (tabla → FK → índices → enum).
3. `BlockchainRpcService` es aditivo (`getCode`, `ethCall`,
   `RpcCallRevertedError`); no altera el comportamiento de CHAIN-001.
