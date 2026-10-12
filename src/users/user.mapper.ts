import { User } from './entities/user.entity';

/**
 * Whitelist de campos de `User` que sí pueden salir en una respuesta HTTP.
 *
 * Es la única fuente de verdad de la forma pública del usuario: el OpenAPI
 * (`UserResponseDto`) y el Zod generado en `@colibri/contracts` se derivan de
 * estos mismos campos. Agregar/quitar un campo acá implica regenerar el
 * contrato (`npm run contract:sync`).
 *
 * No se usa `instanceToPlain` ni el `ClassSerializerInterceptor` porque un
 * spread (`{ ...user }`) pierde la metadata de `class-transformer` y los
 * `@Exclude()` de `password`/`sessionVersion` dejan de aplicarse.
 */
export function toPublicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role, // puede ser null en PENDING_PROFILE
    status: user.status,
    provider: user.provider,
    linkedinId: user.linkedinId,
    googleId: user.googleId,
    cryptoWallet: user.cryptoWallet,
    credentialsWallet: user.credentialsWallet,
    adnHash: user.adnHash,
    bio: user.bio,
    avatar: user.avatar,
    gender: user.gender,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export type PublicUser = ReturnType<typeof toPublicUser>;
