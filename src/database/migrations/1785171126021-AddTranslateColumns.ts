import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTranslateColumns1785171126021 implements MigrationInterface {
  name = 'AddTranslateColumns1785171126021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new translation columns as nullable first
    await queryRunner.query(`ALTER TABLE "rubrics" ADD "name_es" character varying`);
    await queryRunner.query(`ALTER TABLE "rubrics" ADD "name_en" character varying`);
    await queryRunner.query(`ALTER TABLE "rubrics" ADD "description_es" text`);
    await queryRunner.query(`ALTER TABLE "rubrics" ADD "description_en" text`);
    await queryRunner.query(`ALTER TABLE "micro_action_definitions" ADD "instruction_es" text`);
    await queryRunner.query(`ALTER TABLE "micro_action_definitions" ADD "instruction_en" text`);
    await queryRunner.query(`ALTER TABLE "pacs" ADD "title_es" character varying`);
    await queryRunner.query(`ALTER TABLE "pacs" ADD "title_en" character varying`);
    await queryRunner.query(`ALTER TABLE "pacs" ADD "objective_line_es" text`);
    await queryRunner.query(`ALTER TABLE "pacs" ADD "objective_line_en" text`);
    await queryRunner.query(`ALTER TABLE "categories" ADD "name_es" character varying`);
    await queryRunner.query(`ALTER TABLE "categories" ADD "name_en" character varying`);
    await queryRunner.query(`ALTER TABLE "categories" ADD "description_es" text`);
    await queryRunner.query(`ALTER TABLE "categories" ADD "description_en" text`);
    await queryRunner.query(`ALTER TABLE "tramos" ADD "name_es" character varying`);
    await queryRunner.query(`ALTER TABLE "tramos" ADD "name_en" character varying`);
    await queryRunner.query(`ALTER TABLE "tramos" ADD "description_es" text`);
    await queryRunner.query(`ALTER TABLE "tramos" ADD "description_en" text`);
    await queryRunner.query(`ALTER TABLE "tramos" ADD "eligibility_rule_es" text`);
    await queryRunner.query(`ALTER TABLE "tramos" ADD "eligibility_rule_en" text`);

    // Copy existing values to the _es columns
    await queryRunner.query(
      `UPDATE "rubrics" SET "name_es" = "name", "description_es" = "description"`,
    );
    await queryRunner.query(
      `UPDATE "micro_action_definitions" SET "instruction_es" = "instruction"`,
    );
    await queryRunner.query(
      `UPDATE "pacs" SET "title_es" = "title", "objective_line_es" = "objective_line"`,
    );
    await queryRunner.query(
      `UPDATE "categories" SET "name_es" = "name", "description_es" = "description"`,
    );
    await queryRunner.query(
      `UPDATE "tramos" SET "name_es" = "name", "description_es" = "description", "eligibility_rule_es" = "eligibility_rule"`,
    );

    // Set NOT NULL on columns that were originally NOT NULL
    await queryRunner.query(`ALTER TABLE "rubrics" ALTER COLUMN "name_es" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "micro_action_definitions" ALTER COLUMN "instruction_es" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "pacs" ALTER COLUMN "title_es" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "name_es" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "tramos" ALTER COLUMN "name_es" SET NOT NULL`);

    // Drop old columns
    await queryRunner.query(`ALTER TABLE "rubrics" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "rubrics" DROP COLUMN "name"`);
    await queryRunner.query(`ALTER TABLE "micro_action_definitions" DROP COLUMN "instruction"`);
    await queryRunner.query(`ALTER TABLE "pacs" DROP COLUMN "objective_line"`);
    await queryRunner.query(`ALTER TABLE "pacs" DROP COLUMN "title"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "name"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "tramos" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "tramos" DROP COLUMN "name"`);
    await queryRunner.query(`ALTER TABLE "tramos" DROP COLUMN "eligibility_rule"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore original columns as nullable
    await queryRunner.query(`ALTER TABLE "tramos" ADD "eligibility_rule" text`);
    await queryRunner.query(`ALTER TABLE "tramos" ADD "name" character varying`);
    await queryRunner.query(`ALTER TABLE "tramos" ADD "description" text`);
    await queryRunner.query(`ALTER TABLE "categories" ADD "description" text`);
    await queryRunner.query(`ALTER TABLE "categories" ADD "name" character varying`);
    await queryRunner.query(`ALTER TABLE "pacs" ADD "title" character varying`);
    await queryRunner.query(`ALTER TABLE "pacs" ADD "objective_line" text`);
    await queryRunner.query(`ALTER TABLE "micro_action_definitions" ADD "instruction" text`);
    await queryRunner.query(`ALTER TABLE "rubrics" ADD "name" character varying`);
    await queryRunner.query(`ALTER TABLE "rubrics" ADD "description" text`);

    // Copy _es values back to original columns
    await queryRunner.query(
      `UPDATE "rubrics" SET "name" = "name_es", "description" = "description_es"`,
    );
    await queryRunner.query(
      `UPDATE "micro_action_definitions" SET "instruction" = "instruction_es"`,
    );
    await queryRunner.query(
      `UPDATE "pacs" SET "title" = "title_es", "objective_line" = "objective_line_es"`,
    );
    await queryRunner.query(
      `UPDATE "categories" SET "name" = "name_es", "description" = "description_es"`,
    );
    await queryRunner.query(
      `UPDATE "tramos" SET "name" = "name_es", "description" = "description_es", "eligibility_rule" = "eligibility_rule_es"`,
    );

    // Set NOT NULL on columns that were originally NOT NULL
    await queryRunner.query(`ALTER TABLE "rubrics" ALTER COLUMN "name" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "micro_action_definitions" ALTER COLUMN "instruction" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "pacs" ALTER COLUMN "title" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "name" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "tramos" ALTER COLUMN "name" SET NOT NULL`);

    // Drop translation columns
    await queryRunner.query(`ALTER TABLE "tramos" DROP COLUMN "eligibility_rule_en"`);
    await queryRunner.query(`ALTER TABLE "tramos" DROP COLUMN "eligibility_rule_es"`);
    await queryRunner.query(`ALTER TABLE "tramos" DROP COLUMN "description_en"`);
    await queryRunner.query(`ALTER TABLE "tramos" DROP COLUMN "description_es"`);
    await queryRunner.query(`ALTER TABLE "tramos" DROP COLUMN "name_en"`);
    await queryRunner.query(`ALTER TABLE "tramos" DROP COLUMN "name_es"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "description_en"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "description_es"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "name_en"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "name_es"`);
    await queryRunner.query(`ALTER TABLE "pacs" DROP COLUMN "objective_line_en"`);
    await queryRunner.query(`ALTER TABLE "pacs" DROP COLUMN "objective_line_es"`);
    await queryRunner.query(`ALTER TABLE "pacs" DROP COLUMN "title_en"`);
    await queryRunner.query(`ALTER TABLE "pacs" DROP COLUMN "title_es"`);
    await queryRunner.query(`ALTER TABLE "micro_action_definitions" DROP COLUMN "instruction_en"`);
    await queryRunner.query(`ALTER TABLE "micro_action_definitions" DROP COLUMN "instruction_es"`);
    await queryRunner.query(`ALTER TABLE "rubrics" DROP COLUMN "description_en"`);
    await queryRunner.query(`ALTER TABLE "rubrics" DROP COLUMN "description_es"`);
    await queryRunner.query(`ALTER TABLE "rubrics" DROP COLUMN "name_en"`);
    await queryRunner.query(`ALTER TABLE "rubrics" DROP COLUMN "name_es"`);
  }
}
