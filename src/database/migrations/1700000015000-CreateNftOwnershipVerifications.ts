import { MigrationInterface, QueryRunner } from 'typeorm';
export class CreateNftOwnershipVerifications1700000015000 implements MigrationInterface {
  name = 'CreateNftOwnershipVerifications1700000015000';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."nft_ownership_verifications_status_enum"
      AS ENUM (
        'verified',
        'not_owner',
        'invalid',
        'unavailable'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "nft_ownership_verifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nft_project_id" uuid,
        "chain_id" integer NOT NULL,
        "contract_address" character varying NOT NULL,
        "token_id" character varying NOT NULL,
        "wallet_address" character varying(42) NOT NULL,
        "owner_address" character varying(42),
        "status" "public"."nft_ownership_verifications_status_enum" NOT NULL,
        "block_number" bigint,
        "block_hash" character varying,
        "block_timestamp" TIMESTAMP,
        "rpc_error" text,
        "validation_error" text,
        "checked_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_nft_ownership_verifications" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_verifications"
      ADD CONSTRAINT "FK_nft_ownership_verifications_nft_project"
      FOREIGN KEY ("nft_project_id")
      REFERENCES "nft_projects"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_nft_ownership_verifications_chain_id"
      ON "nft_ownership_verifications" ("chain_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_nft_ownership_verifications_wallet_address"
      ON "nft_ownership_verifications" ("wallet_address")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_nft_ownership_verifications_project_checked"
      ON "nft_ownership_verifications"
      ("nft_project_id", "checked_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_nft_ownership_verifications_project_checked"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_nft_ownership_verifications_wallet_address"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_nft_ownership_verifications_chain_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_verifications"
      DROP CONSTRAINT "FK_nft_ownership_verifications_nft_project"
    `);

    await queryRunner.query(`
      DROP TABLE "nft_ownership_verifications"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."nft_ownership_verifications_status_enum"
    `);
  }
}
