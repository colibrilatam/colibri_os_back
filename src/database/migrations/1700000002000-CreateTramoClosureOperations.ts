import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTramoClosureOperations1700000002000 implements MigrationInterface {
  name = 'CreateTramoClosureOperations1700000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tramo_closure_operations_status_enum" AS ENUM('pending', 'in_progress', 'completed', 'failed')`,
    );

    await queryRunner.query(
      `CREATE TABLE "tramo_closure_operations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "idempotency_key" character varying NOT NULL,
        "project_id" uuid NOT NULL,
        "tramo_id" uuid NOT NULL,
        "status" "public"."tramo_closure_operations_status_enum" NOT NULL DEFAULT 'pending',
        "attempts" integer NOT NULL DEFAULT '0',
        "last_error" text,
        "result_payload" jsonb,
        "requested_by_user_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "completed_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "UQ_tramo_closure_operations_idempotency_key" UNIQUE ("idempotency_key"),
        CONSTRAINT "PK_tramo_closure_operations" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_tramo_closure_operations_project_id" ON "tramo_closure_operations" ("project_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tramo_closure_operations_status" ON "tramo_closure_operations" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_tramo_closure_operations_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_tramo_closure_operations_project_id"`);
    await queryRunner.query(`DROP TABLE "tramo_closure_operations"`);
    await queryRunner.query(`DROP TYPE "public"."tramo_closure_operations_status_enum"`);
  }
}