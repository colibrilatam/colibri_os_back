import { MigrationInterface, QueryRunner } from 'typeorm';

export class UsersEmailCaseInsensitiveUnique1700000001000 implements MigrationInterface {
  name = 'UsersEmailCaseInsensitiveUnique1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_users_email_lower" ON "users" (lower("email"));
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_users_email_lower"`);
  }
}
