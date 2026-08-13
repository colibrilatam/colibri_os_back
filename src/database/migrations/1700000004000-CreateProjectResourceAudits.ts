import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProjectResourceAudits1700000004000 implements MigrationInterface {
  name = 'CreateProjectResourceAudits1700000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."project_resource_audits_resource_type_enum" AS ENUM('project', 'project_pac')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."project_resource_audits_action_enum" AS ENUM('update', 'delete', 'pac_create', 'pac_status_change', 'pac_delete')`,
    );

    await queryRunner.query(
      `CREATE TABLE "project_resource_audits" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "resource_type" "public"."project_resource_audits_resource_type_enum" NOT NULL,
        "resource_id" uuid NOT NULL,
        "action" "public"."project_resource_audits_action_enum" NOT NULL,
        "performed_by_user_id" uuid NOT NULL,
        "project_id" uuid NOT NULL,
        "changes" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_project_resource_audits" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_project_resource_audits_resource" ON "project_resource_audits" ("resource_type", "resource_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_project_resource_audits_project" ON "project_resource_audits" ("project_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_project_resource_audits_performed_by" ON "project_resource_audits" ("performed_by_user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_project_resource_audits_performed_by"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_project_resource_audits_project"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_project_resource_audits_resource"`);
    await queryRunner.query(`DROP TABLE "project_resource_audits"`);
    await queryRunner.query(`DROP TYPE "public"."project_resource_audits_action_enum"`);
    await queryRunner.query(`DROP TYPE "public"."project_resource_audits_resource_type_enum"`);
  }
}