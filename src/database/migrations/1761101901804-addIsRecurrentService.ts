import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsRecurrentService1761101901804 implements MigrationInterface {
  name = 'AddIsRecurrentService1761101901804';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "service" ADD "isRecurrent" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "charge_exception" ALTER COLUMN "newAmount" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "charge" ALTER COLUMN "amount" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "service" ALTER COLUMN "defaultPrice" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ALTER COLUMN "price" TYPE numeric`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "enrollments" ALTER COLUMN "price" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "service" ALTER COLUMN "defaultPrice" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "charge" ALTER COLUMN "amount" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "charge_exception" ALTER COLUMN "newAmount" TYPE numeric`,
    );
    await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "isRecurrent"`);
  }
}
