import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * SEC-002: añade 'demo_readonly' al enum nativo de Postgres `users_role_enum`.
 *
 * La columna `users.role` es un enum nativo (`type: 'enum'` en la entity), no un
 * varchar con CHECK. Sin este valor en el enum, cualquier INSERT con
 * role='demo_readonly' falla con `invalid input value for enum users_role_enum`.
 *
 * El valor solo se usa cuando el seed (PR-BE4) crea cuentas demo. Hasta entonces
 * no hay ningún row con ese rol.
 */
export class AddDemoReadonlyRole1700000012000 implements MigrationInterface {
  name = 'AddDemoReadonlyRole1700000012000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'users_role_enum'
            AND e.enumlabel = 'demo_readonly'
        ) THEN
          ALTER TYPE "public"."users_role_enum" ADD VALUE 'demo_readonly';
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL no soporta eliminar un valor de un enum nativo.
    // El valor 'demo_readonly' queda inofensivo si no se usa en ningún row.
    throw new Error('Down migration not supported for this change.');
  }
}