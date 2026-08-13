import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNftResourceAudits1700000003000 implements MigrationInterface {
  name = 'CreateNftResourceAudits1700000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."nft_resource_audits_resource_type_enum" AS ENUM('nft_actor', 'mecenas_portfolio')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."nft_resource_audits_action_enum" AS ENUM('update')`,
    );

    await queryRunner.query(
      `CREATE TABLE "nft_resource_audits" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "resource_type" "public"."nft_resource_audits_resource_type_enum" NOT NULL,
        "resource_id" uuid NOT NULL,
        "action" "public"."nft_resource_audits_action_enum" NOT NULL DEFAULT 'update',
        "performed_by_user_id" uuid NOT NULL,
        "owner_user_id" uuid NOT NULL,
        "changes" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_nft_resource_audits" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_nft_resource_audits_resource" ON "nft_resource_audits" ("resource_type", "resource_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_nft_resource_audits_performed_by" ON "nft_resource_audits" ("performed_by_user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_nft_resource_audits_performed_by"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_nft_resource_audits_resource"`);
    await queryRunner.query(`DROP TABLE "nft_resource_audits"`);
    await queryRunner.query(`DROP TYPE "public"."nft_resource_audits_action_enum"`);
    await queryRunner.query(`DROP TYPE "public"."nft_resource_audits_resource_type_enum"`);
  }
}