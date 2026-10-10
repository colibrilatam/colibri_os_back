import { UserRole } from '../users/entities/user.entity';

/**
 * SEC-002 / B1: roles que un usuario puede auto-asignarse al crear su cuenta o
 * al completar el perfil.
 *
 * Este es el unico punto de verdad. Tanto los DTO (`@IsIn`) como los servicios
 * (`assertSelfAssignableRole`) deben leer de aqui, para que agregar un rol
 * privilegiado exija un cambio unico y visible.
 *
 * NO se incluyen roles privilegiados: ADMIN, DEMO_READONLY ni los MECENAS_*.
 * `DEMO_READONLY` queda fuera a proposito: las cuentas demo se siembran, no se
 * auto-registran. Permitirlo aqui abriria la misma via de escalada que B1.
 */
export const ALLOWED_SELF_ASSIGN_ROLES: readonly UserRole[] = [
  UserRole.ENTREPRENEUR,
  UserRole.EVALUATOR,
] as const;

export function isSelfAssignableRole(role: UserRole | null | undefined): boolean {
  return !!role && ALLOWED_SELF_ASSIGN_ROLES.includes(role);
}