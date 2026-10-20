import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEvaluatorNotifiedAtToVersions1700000016000 implements MigrationInterface {
  name = 'AddEvaluatorNotifiedAtToVersions1700000016000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "micro_action_instance_versions" ADD COLUMN "evaluator_notified_at" TIMESTAMPTZ`,
    );
    // Las versiones históricas se marcan como ya notificadas (no reenviar mails viejos).
    await queryRunner.query(
      `UPDATE "micro_action_instance_versions" SET "evaluator_notified_at" = "created_at"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "micro_action_instance_versions" DROP COLUMN "evaluator_notified_at"`,
    );
  }
}