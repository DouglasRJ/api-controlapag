import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDatesClient1758998325028 implements MigrationInterface {
  name = 'AddDatesClient1758998325028';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "client" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "client" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "client" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "client" DROP COLUMN "createdAt"`);
  }
}
