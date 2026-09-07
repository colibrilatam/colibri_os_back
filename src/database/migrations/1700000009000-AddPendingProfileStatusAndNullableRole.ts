import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPendingProfileStatusAndNullableRole1700000009000 implements MigrationInterface {
  name = 'AddPendingProfileStatusAndNullableRole1700000009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar el valor 'pending_profile' al enum users_status_enum (si no existe)
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'users_status_enum'
            AND e.enumlabel = 'pending_profile'
        ) THEN
          ALTER TYPE "public"."users_status_enum" ADD VALUE 'pending_profile';
        END IF;
      END $$;
    `);

    // 2. Hacer que la columna "role" de users acepte NULL
    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "role" DROP NOT NULL;
    `);

    // 3. Hacer que la columna "previous_role" de user_role_change_audits acepte NULL
    await queryRunner.query(`
      ALTER TABLE "user_role_change_audits" ALTER COLUMN "previous_role" DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // El down es complejo porque eliminar un valor de enum no es directo en PostgreSQL.
    // Se recomienda no revertir esta migración o, si es necesario, recrear el enum sin el valor.
    // Para simplificar, lanzamos un error o dejamos vacío.
    throw new Error('Down migration not supported for this change.');
  }
}