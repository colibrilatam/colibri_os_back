import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMicroActionInstanceVersions1700000005000 implements MigrationInterface {
  name = 'CreateMicroActionInstanceVersions1700000005000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."micro_action_instance_versions_change_type_enum" AS ENUM('created', 'status_change', 'notes_update', 'submitted', 'reopened')`,
    );

    await queryRunner.query(
      `CREATE TABLE "micro_action_instance_versions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "micro_action_instance_id" uuid NOT NULL,
        "version_number" integer NOT NULL,
        "change_type" "public"."micro_action_instance_versions_change_type_enum" NOT NULL,
        "status" "public"."micro_action_instances_status_enum" NOT NULL,
        "previous_status" "public"."micro_action_instances_status_enum",
        "execution_notes" text,
        "attempt_number" integer NOT NULL,
        "reopened_count" integer NOT NULL,
        "change_summary" text,
        "supersedes_version_number" integer,
        "created_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_mai_versions_instance_version" UNIQUE ("micro_action_instance_id", "version_number"),
        CONSTRAINT "PK_mai_versions" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `ALTER TABLE "micro_action_instance_versions" ADD CONSTRAINT "FK_mai_versions_instance" FOREIGN KEY ("micro_action_instance_id") REFERENCES "micro_action_instances"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "micro_action_instance_versions" ADD CONSTRAINT "FK_mai_versions_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_mai_versions_instance" ON "micro_action_instance_versions" ("micro_action_instance_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_mai_versions_instance"`);
    await queryRunner.query(
      `ALTER TABLE "micro_action_instance_versions" DROP CONSTRAINT "FK_mai_versions_created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "micro_action_instance_versions" DROP CONSTRAINT "FK_mai_versions_instance"`,
    );
    await queryRunner.query(`DROP TABLE "micro_action_instance_versions"`);
    await queryRunner.query(
      `DROP TYPE "public"."micro_action_instance_versions_change_type_enum"`,
    );
  }
}