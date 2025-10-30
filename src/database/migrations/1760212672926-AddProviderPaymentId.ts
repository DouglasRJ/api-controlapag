import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProviderPaymentId1760212672926 implements MigrationInterface {
  name = 'AddProviderPaymentId1760212672926';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "provider" ADD "providerPaymentId" character varying`,
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
      `ALTER TABLE "provider" DROP COLUMN "providerPaymentId"`,
    );
  }
}
