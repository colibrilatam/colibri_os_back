import { MigrationInterface, QueryRunner } from 'typeorm';

export class SimplifyMicroActionInstanceStatus1700000008000 implements MigrationInterface {
  name = 'SimplifyMicroActionInstanceStatus1700000008000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Migrar datos: completed/validated/closed → completed, todo lo demás → pending
    await queryRunner.query(
      `UPDATE "micro_action_instances"
       SET "status" = 'completed'
       WHERE "status" IN ('completed', 'validated', 'closed')`,
    );

    await queryRunner.query(
      `UPDATE "micro_action_instances"
       SET "status" = 'pending'
       WHERE "status" NOT IN ('pending', 'completed')`,
    );

    // Migrar datos en micro_action_instance_versions
    await queryRunner.query(
      `UPDATE "micro_action_instance_versions"
       SET "status" = 'completed'
       WHERE "status" IN ('completed', 'validated', 'closed')`,
    );

    await queryRunner.query(
      `UPDATE "micro_action_instance_versions"
       SET "status" = 'pending'
       WHERE "status" NOT IN ('pending', 'completed')`,
    );

    await queryRunner.query(
      `UPDATE "micro_action_instance_versions"
       SET "previous_status" = 'completed'
       WHERE "previous_status" IN ('completed', 'validated', 'closed')`,
    );

    await queryRunner.query(
      `UPDATE "micro_action_instance_versions"
       SET "previous_status" = 'pending'
       WHERE "previous_status" NOT IN ('pending', 'completed', NULL)`,
    );

    // Crear nuevo enum type con pending, submitted y completed
    await queryRunner.query(
      `CREATE TYPE "public"."micro_action_instances_status_enum_v2" AS ENUM('pending', 'submitted', 'completed')`,
    );

    // Cambiar columna de micro_action_instances al nuevo tipo
    await queryRunner.query(
      `ALTER TABLE "micro_action_instances"
       ALTER COLUMN "status" DROP DEFAULT`,
    );

    await queryRunner.query(
      `ALTER TABLE "micro_action_instances"
       ALTER COLUMN "status" TYPE "public"."micro_action_instances_status_enum_v2"
       USING "status"::text::"public"."micro_action_instances_status_enum_v2"`,
    );

    await queryRunner.query(
      `ALTER TABLE "micro_action_instances"
       ALTER COLUMN "status" SET DEFAULT 'pending'`,
    );

    // Cambiar columna de micro_action_instance_versions al nuevo tipo
    await queryRunner.query(
      `ALTER TABLE "micro_action_instance_versions"
       ALTER COLUMN "status" TYPE "public"."micro_action_instances_status_enum_v2"
       USING "status"::text::"public"."micro_action_instances_status_enum_v2"`,
    );

    await queryRunner.query(
      `ALTER TABLE "micro_action_instance_versions"
       ALTER COLUMN "previous_status" TYPE "public"."micro_action_instances_status_enum_v2"
       USING "previous_status"::text::"public"."micro_action_instances_status_enum_v2"`,
    );

    // Eliminar el viejo tipo y renombrar el nuevo
    await queryRunner.query(`DROP TYPE "public"."micro_action_instances_status_enum"`);

    await queryRunner.query(
      `ALTER TYPE "public"."micro_action_instances_status_enum_v2" RENAME TO "micro_action_instances_status_enum"`,
    );

    // Agregar valores 'rejected' y 'completed' al enum de change_type de versiones (si no existen)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'micro_action_instance_versions_change_type_enum'
            AND e.enumlabel = 'rejected'
        ) THEN
          ALTER TYPE "public"."micro_action_instance_versions_change_type_enum" ADD VALUE 'rejected';
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'micro_action_instance_versions_change_type_enum'
            AND e.enumlabel = 'completed'
        ) THEN
          ALTER TYPE "public"."micro_action_instance_versions_change_type_enum" ADD VALUE 'completed';
        END IF;
      END$$;
    `);

    // Agregar columna canonical_uri a micro_action_instance_versions (si no existe)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'micro_action_instance_versions'
            AND column_name = 'canonical_uri'
        ) THEN
          ALTER TABLE "micro_action_instance_versions" ADD COLUMN "canonical_uri" text;
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restaurar el enum original con todos los estados
    await queryRunner.query(
      `CREATE TYPE "public"."micro_action_instances_status_enum_prev" AS ENUM(
        'pending', 'started', 'in_progress', 'submitted', 'validated', 'completed', 'closed', 'reopened'
      )`,
    );

    // Las columnas apuntan al tipo renombrado (micro_action_instances_status_enum)
    // que ahora tiene solo pending/completed. Necesitamos castear a varchar primero
    // para poder insertar valores del enum completo.

    await queryRunner.query(
      `ALTER TABLE "micro_action_instance_versions"
       ALTER COLUMN "previous_status" TYPE "public"."micro_action_instances_status_enum_prev"
       USING "previous_status"::text::"public"."micro_action_instances_status_enum_prev"`,
    );

    await queryRunner.query(
      `ALTER TABLE "micro_action_instance_versions"
       ALTER COLUMN "status" TYPE "public"."micro_action_instances_status_enum_prev"
       USING "status"::text::"public"."micro_action_instances_status_enum_prev"`,
    );

    await queryRunner.query(
      `ALTER TABLE "micro_action_instances"
       ALTER COLUMN "status" DROP DEFAULT`,
    );

    await queryRunner.query(
      `ALTER TABLE "micro_action_instances"
       ALTER COLUMN "status" TYPE "public"."micro_action_instances_status_enum_prev"
       USING "status"::text::"public"."micro_action_instances_status_enum_prev"`,
    );

    await queryRunner.query(
      `ALTER TABLE "micro_action_instances"
       ALTER COLUMN "status" SET DEFAULT 'pending'`,
    );

    await queryRunner.query(`DROP TYPE "public"."micro_action_instances_status_enum"`);

    await queryRunner.query(
      `ALTER TYPE "public"."micro_action_instances_status_enum_prev" RENAME TO "micro_action_instances_status_enum"`,
    );
  }
}
