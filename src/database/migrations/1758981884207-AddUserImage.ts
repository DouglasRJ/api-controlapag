import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserImage1758981884207 implements MigrationInterface {
  name = 'AddUserImage1758981884207';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "image" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "image"`);
  }
}
