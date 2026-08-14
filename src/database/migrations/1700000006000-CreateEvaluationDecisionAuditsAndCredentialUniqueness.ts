import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEvaluationDecisionAuditsAndCredentialUniqueness1700000006000
  implements MigrationInterface
{
  name = 'CreateEvaluationDecisionAuditsAndCredentialUniqueness1700000006000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── BE-001: auditoría de decisiones de evaluación ───────────────────────
    await queryRunner.query(
      `CREATE TABLE "evaluation_decision_audits" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "evaluation_id" uuid NOT NULL,
        "evidence_id" uuid NOT NULL,
        "performed_by_user_id" uuid NOT NULL,
        "performed_by_role" "public"."users_role_enum" NOT NULL,
        "result" "public"."evaluations_evaluation_result_enum" NOT NULL,
        "score" numeric(5,2),
        "previous_evidence_status" character varying NOT NULL,
        "new_evidence_status" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_evaluation_decision_audits" PRIMARY KEY ("id")
      )`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_evaluation_decision_audits_evaluation" ON "evaluation_decision_audits" ("evaluation_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_evaluation_decision_audits_evidence" ON "evaluation_decision_audits" ("evidence_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_evaluation_decision_audits_performed_by" ON "evaluation_decision_audits" ("performed_by_user_id")`,
    );

    // ─── BE-001: evita emitir dos credenciales "issued" para la misma evidencia ──
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_digital_credentials_evidence_type_issued"
       ON "digital_credentials" ("evidence_id", "credential_type")
       WHERE "status" = 'issued'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_digital_credentials_evidence_type_issued"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_evaluation_decision_audits_performed_by"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_evaluation_decision_audits_evidence"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_evaluation_decision_audits_evaluation"`);
    await queryRunner.query(`DROP TABLE "evaluation_decision_audits"`);
  }
}