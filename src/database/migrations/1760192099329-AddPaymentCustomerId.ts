import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentCustomerId1760192099329 implements MigrationInterface {
  name = 'AddPaymentCustomerId1760192099329';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "provider" ADD "subscriptionId" character varying`,
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
    await queryRunner.query(
      `ALTER TABLE "provider" DROP COLUMN "subscriptionId"`,
    );
  }
}
