import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBlockchainProofToNftOwnershipEvents1700000007000
  implements MigrationInterface
{
  name =
    'AddBlockchainProofToNftOwnershipEvents1700000007000';

  public async up(
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."nft_ownership_events_chain_status_enum"
      AS ENUM (
        'pending',
        'confirmed',
        'reverted',
        'invalid'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      ADD COLUMN "chain_status"
      "public"."nft_ownership_events_chain_status_enum"
      NOT NULL DEFAULT 'pending'
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      ADD COLUMN "chain_id" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      ADD COLUMN "contract_address" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      ADD COLUMN "token_id" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      ADD COLUMN "from_address" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      ADD COLUMN "to_address" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      ADD COLUMN "block_number" bigint
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      ADD COLUMN "block_hash" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      ADD COLUMN "confirmations" integer
      NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      ADD COLUMN "required_confirmations" integer
      NOT NULL DEFAULT 12
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      ADD COLUMN "validation_error" text
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      ADD COLUMN "verified_at" TIMESTAMP
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      ADD COLUMN "last_reconciled_at" TIMESTAMP
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_nft_ownership_events_chain_status"
      ON "nft_ownership_events" ("chain_status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_nft_ownership_events_tx_hash"
      ON "nft_ownership_events" ("tx_hash")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_nft_ownership_events_project_tx"
      ON "nft_ownership_events"
      ("nft_project_id", "tx_hash")
    `);

    // Los registros históricos que no tienen txHash no pueden
    // considerarse prueba blockchain.
    await queryRunner.query(`
      UPDATE "nft_ownership_events"
      SET
        "chain_status" = 'invalid',
        "validation_error" =
          'Registro histórico sin txHash: no existe prueba on-chain reconstruible',
        "last_reconciled_at" = now()
      WHERE "tx_hash" IS NULL
    `);

    // Los registros que sí tienen hash quedan pending hasta que
    // el reconciliador los valide contra RPC.
    await queryRunner.query(`
      UPDATE "nft_ownership_events"
      SET
        "chain_status" = 'pending',
        "last_reconciled_at" = NULL
      WHERE "tx_hash" IS NOT NULL
    `);
  }

  public async down(
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_nft_ownership_events_project_tx"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_nft_ownership_events_tx_hash"
    `);

    await queryRunner.query(`
      DROP INDEX "public"."IDX_nft_ownership_events_chain_status"
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      DROP COLUMN "last_reconciled_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      DROP COLUMN "verified_at"
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      DROP COLUMN "validation_error"
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      DROP COLUMN "required_confirmations"
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      DROP COLUMN "confirmations"
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      DROP COLUMN "block_hash"
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      DROP COLUMN "block_number"
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      DROP COLUMN "to_address"
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      DROP COLUMN "from_address"
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      DROP COLUMN "token_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      DROP COLUMN "contract_address"
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      DROP COLUMN "chain_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "nft_ownership_events"
      DROP COLUMN "chain_status"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."nft_ownership_events_chain_status_enum"
    `);
  }
}