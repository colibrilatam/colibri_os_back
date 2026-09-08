import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthorizationDenialAudits1700000010000 implements MigrationInterface {
  name = 'CreateAuthorizationDenialAudits1700000010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."authorization_denial_audits_reason_enum" AS ENUM(
        'not_owner_or_member', 'not_primary_operator', 'not_assigned_evaluator', 'role_not_allowed'
      )`,
    );

    await queryRunner.query(
      `CREATE TABLE "authorization_denial_audits" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "resource_type" character varying NOT NULL,
        "resource_id" character varying,
        "action" character varying NOT NULL,
        "attempted_by_user_id" uuid NOT NULL,
        "attempted_by_role" "public"."users_role_enum" NOT NULL,
        "reason" "public"."authorization_denial_audits_reason_enum" NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_authorization_denial_audits" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_authorization_denial_audits_attempted_by" ON "authorization_denial_audits" ("attempted_by_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_authorization_denial_audits_resource" ON "authorization_denial_audits" ("resource_type", "resource_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_authorization_denial_audits_resource"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_authorization_denial_audits_attempted_by"`);
    await queryRunner.query(`DROP TABLE "authorization_denial_audits"`);
    await queryRunner.query(`DROP TYPE "public"."authorization_denial_audits_reason_enum"`);
  }
}