import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOAuthExchangeCodes1700000009000 implements MigrationInterface {
  name = 'CreateOAuthExchangeCodes1700000009000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "oauth_exchange_codes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "code_hash" character varying NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "used_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_oauth_exchange_codes_code_hash" UNIQUE ("code_hash"),
        CONSTRAINT "PK_oauth_exchange_codes" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "oauth_exchange_codes"
      ADD CONSTRAINT "FK_oauth_exchange_codes_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_oauth_exchange_codes_user_id" ON "oauth_exchange_codes" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_oauth_exchange_codes_user_id"`);
    await queryRunner.query(`ALTER TABLE "oauth_exchange_codes" DROP CONSTRAINT "FK_oauth_exchange_codes_user"`);
    await queryRunner.query(`DROP TABLE "oauth_exchange_codes"`);
  }
}