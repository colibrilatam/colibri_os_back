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
    // PostgreSQL no soporta ALTER TYPE ... DROP VALUE. El workaround estándar
    // es recrear el enum sin el valor, migrar TODAS las columnas que lo
    // usan, y renombrar.
    //
    // Columnas que usan users_role_enum (verificado contra la DB):
    //   - users.role
    //   - evaluation_decision_audits.performed_by_role
    //   - authorization_denial_audits.attempted_by_role

    // 1. Mover filas con demo_readonly a un valor seguro (entrepreneur).
    await queryRunner.query(`
      UPDATE "users" SET "role" = 'entrepreneur' WHERE "role" = 'demo_readonly';
    `);
    await queryRunner.query(`
      UPDATE "evaluation_decision_audits" SET "performed_by_role" = 'entrepreneur'
      WHERE "performed_by_role" = 'demo_readonly';
    `);
    await queryRunner.query(`
      UPDATE "authorization_denial_audits" SET "attempted_by_role" = 'entrepreneur'
      WHERE "attempted_by_role" = 'demo_readonly';
    `);

    // 2. Enum temporal sin demo_readonly.
    await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum_tmp" AS ENUM(
        'entrepreneur', 'mentor', 'evaluator',
        'mecenas_semilla', 'mecenas_fundacional', 'mecenas_cambio',
        'admin', 'guest'
      );
    `);

    // 3. Migrar cada columna al tipo temporal.
    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "role" TYPE "public"."users_role_enum_tmp"
        USING ("role"::text::"public"."users_role_enum_tmp");
    `);
    await queryRunner.query(`
      ALTER TABLE "evaluation_decision_audits"
        ALTER COLUMN "performed_by_role" TYPE "public"."users_role_enum_tmp"
        USING ("performed_by_role"::text::"public"."users_role_enum_tmp");
    `);
    await queryRunner.query(`
      ALTER TABLE "authorization_denial_audits"
        ALTER COLUMN "attempted_by_role" TYPE "public"."users_role_enum_tmp"
        USING ("attempted_by_role"::text::"public"."users_role_enum_tmp");
    `);

    // 4. Eliminar el enum viejo y renombrar el temporal.
    await queryRunner.query(`DROP TYPE "public"."users_role_enum";`);
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum_tmp" RENAME TO "users_role_enum";`,
    );
  }
}