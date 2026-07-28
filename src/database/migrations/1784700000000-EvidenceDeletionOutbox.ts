import { MigrationInterface, QueryRunner } from 'typeorm';

export class EvidenceDeletionOutbox1784700000000 implements MigrationInterface {
  name = 'EvidenceDeletionOutbox1784700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agrega el nuevo valor al enum de estado de evidencia (defensivo: solo si el tipo existe)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'evidences_status_enum') THEN
          ALTER TYPE "evidences_status_enum" ADD VALUE IF NOT EXISTS 'deletion_pending';
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TYPE "evidence_deletion_outbox_status_enum" AS ENUM ('pending', 'processing', 'completed', 'failed');
    `);

    await queryRunner.query(`
      CREATE TABLE "evidence_deletion_outbox" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "evidence_id" uuid NOT NULL,
        "cloudinary_public_id" character varying,
        "resource_type" character varying NOT NULL DEFAULT 'raw',
        "status" "evidence_deletion_outbox_status_enum" NOT NULL DEFAULT 'pending',
        "attempts" integer NOT NULL DEFAULT 0,
        "last_error" text,
        "requested_by_user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "processed_at" TIMESTAMP,
        CONSTRAINT "PK_evidence_deletion_outbox" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_deletion_outbox_status" ON "evidence_deletion_outbox" ("status");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_deletion_outbox_evidence_id" ON "evidence_deletion_outbox" ("evidence_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_deletion_outbox_evidence_id"`);
    await queryRunner.query(`DROP INDEX "IDX_deletion_outbox_status"`);
    await queryRunner.query(`DROP TABLE "evidence_deletion_outbox"`);
    await queryRunner.query(`DROP TYPE "evidence_deletion_outbox_status_enum"`);
    // Nota: Postgres no permite quitar un valor de un enum fácilmente,
    // por eso 'deletion_pending' no se revierte acá.
  }
}
