import { MigrationInterface, QueryRunner } from 'typeorm';

export class SecureEvidenceAndAuthorization1784635200000 implements MigrationInterface {
  name = 'SecureEvidenceAndAuthorization1784635200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_role_change_audits" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "target_user_id" uuid NOT NULL,
        "changed_by_user_id" uuid NOT NULL,
        "previous_role" character varying NOT NULL,
        "next_role" character varying NOT NULL,
        "reason" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_role_change_audits" PRIMARY KEY ("id"),
        CONSTRAINT "FK_role_audit_target_user" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_role_audit_changed_by_user" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "upload_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "evidence_id" uuid NOT NULL,
        "author_user_id" uuid NOT NULL,
        "project_id" uuid NOT NULL,
        "expected_public_id" character varying NOT NULL,
        "folder" character varying NOT NULL,
        "mime_type" character varying NOT NULL,
        "resource_type" character varying NOT NULL,
        "max_bytes" integer NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "consumed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_upload_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_upload_sessions_expected_public_id" UNIQUE ("expected_public_id"),
        CONSTRAINT "FK_upload_session_evidence" FOREIGN KEY ("evidence_id") REFERENCES "evidences"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_upload_session_author" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_upload_session_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_upload_sessions_pending" ON "upload_sessions" ("evidence_id", "author_user_id", "expires_at") WHERE "consumed_at" IS NULL',
    );

    await queryRunner.query(
      'ALTER TABLE "evaluations" ADD COLUMN IF NOT EXISTS "created_by_user_id" uuid',
    );
    await queryRunner.query(
      'ALTER TABLE "evaluations" ADD COLUMN IF NOT EXISTS "finalized_by_user_id" uuid',
    );
    await queryRunner.query(
      'ALTER TABLE "evaluations" ADD CONSTRAINT "FK_evaluations_created_by_user" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "evaluations" ADD CONSTRAINT "FK_evaluations_finalized_by_user" FOREIGN KEY ("finalized_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL',
    );

    await queryRunner.query(
      'ALTER TABLE "evidence_versions" ADD COLUMN IF NOT EXISTS "hash_algorithm" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "evidence_versions" ADD COLUMN IF NOT EXISTS "cloudinary_public_id" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "evidence_versions" ADD COLUMN IF NOT EXISTS "asset_version" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "evidence_versions" ADD COLUMN IF NOT EXISTS "provider_checksum" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "evidence_versions" ADD COLUMN IF NOT EXISTS "mime_type" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "evidence_versions" ADD COLUMN IF NOT EXISTS "byte_size" integer',
    );
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_evidence_versions_evidence_version'
        ) THEN
          ALTER TABLE "evidence_versions"
          ADD CONSTRAINT "UQ_evidence_versions_evidence_version"
          UNIQUE ("evidence_id", "version_number");
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "evidence_versions" DROP CONSTRAINT IF EXISTS "UQ_evidence_versions_evidence_version"',
    );
    await queryRunner.query('ALTER TABLE "evidence_versions" DROP COLUMN IF EXISTS "byte_size"');
    await queryRunner.query('ALTER TABLE "evidence_versions" DROP COLUMN IF EXISTS "mime_type"');
    await queryRunner.query(
      'ALTER TABLE "evidence_versions" DROP COLUMN IF EXISTS "provider_checksum"',
    );
    await queryRunner.query(
      'ALTER TABLE "evidence_versions" DROP COLUMN IF EXISTS "asset_version"',
    );
    await queryRunner.query(
      'ALTER TABLE "evidence_versions" DROP COLUMN IF EXISTS "cloudinary_public_id"',
    );
    await queryRunner.query(
      'ALTER TABLE "evidence_versions" DROP COLUMN IF EXISTS "hash_algorithm"',
    );
    await queryRunner.query(
      'ALTER TABLE "evaluations" DROP CONSTRAINT IF EXISTS "FK_evaluations_finalized_by_user"',
    );
    await queryRunner.query(
      'ALTER TABLE "evaluations" DROP CONSTRAINT IF EXISTS "FK_evaluations_created_by_user"',
    );
    await queryRunner.query(
      'ALTER TABLE "evaluations" DROP COLUMN IF EXISTS "finalized_by_user_id"',
    );
    await queryRunner.query('ALTER TABLE "evaluations" DROP COLUMN IF EXISTS "created_by_user_id"');
    await queryRunner.query('DROP TABLE IF EXISTS "upload_sessions"');
    await queryRunner.query('DROP TABLE IF EXISTS "user_role_change_audits"');
  }
}
