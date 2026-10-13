import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWalletProviderEnum1700000013000 implements MigrationInterface {
  name = 'AddWalletProviderEnum1700000013000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'users_provider_enum'
            AND e.enumlabel = 'wallet'
        ) THEN
          ALTER TYPE "public"."users_provider_enum" ADD VALUE 'wallet';
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "users" SET "provider" = 'local' WHERE "provider" = 'wallet';
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."users_provider_enum_tmp" AS ENUM('local', 'google');
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "provider" DROP DEFAULT;
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "provider" TYPE "public"."users_provider_enum_tmp"
        USING ("provider"::text::"public"."users_provider_enum_tmp");
    `);

    await queryRunner.query(`DROP TYPE "public"."users_provider_enum";`);
    await queryRunner.query(
      `ALTER TYPE "public"."users_provider_enum_tmp" RENAME TO "users_provider_enum";`,
    );

    await queryRunner.query(`
      ALTER TABLE "users"
        ALTER COLUMN "provider" SET DEFAULT 'local';
    `);
  }
}
