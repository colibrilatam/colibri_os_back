import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWalletNonces1700000014000 implements MigrationInterface {
  name = 'CreateWalletNonces1700000014000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "wallet_nonces" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nonce" character varying(66) NOT NULL,
        "purpose" character varying(10) NOT NULL,
        "user_id" uuid,
        "wallet_address" character varying(42) NOT NULL,
        "message" text NOT NULL,
        "domain" character varying(255) NOT NULL,
        "uri" character varying(255) NOT NULL,
        "chain_id" integer NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "used_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_wallet_nonces_nonce" UNIQUE ("nonce"),
        CONSTRAINT "PK_wallet_nonces" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_wallet_nonces_purpose" CHECK ("purpose" IN ('login','link')),
        CONSTRAINT "CHK_wallet_nonces_link_has_user" CHECK (
          ("purpose" = 'link' AND "user_id" IS NOT NULL) OR
          ("purpose" = 'login' AND "user_id" IS NULL)
        )
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "wallet_nonces"
      ADD CONSTRAINT "FK_wallet_nonces_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_wallet_nonces_wallet_address" ON "wallet_nonces" ("wallet_address", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_wallet_nonces_user_id" ON "wallet_nonces" ("user_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_wallet_nonces_expires_at" ON "wallet_nonces" ("expires_at") WHERE "used_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_users_crypto_wallet" ON "users" ("crypto_wallet") WHERE "crypto_wallet" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_users_crypto_wallet"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_wallet_nonces_expires_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_wallet_nonces_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_wallet_nonces_wallet_address"`);
    await queryRunner.query(`ALTER TABLE "wallet_nonces" DROP CONSTRAINT "FK_wallet_nonces_user"`);
    await queryRunner.query(`DROP TABLE "wallet_nonces"`);
  }
}
