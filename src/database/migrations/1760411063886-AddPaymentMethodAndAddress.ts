import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentMethodAndAddress1760411063886 implements MigrationInterface {
    name = 'AddPaymentMethodAndAddress1760411063886'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service" ADD "address" character varying`);
        await queryRunner.query(`CREATE TYPE "public"."service_allowedpaymentmethods_enum" AS ENUM('PIX', 'CREDIT_CARD', 'CASH', 'BANK_SLIP')`);
        await queryRunner.query(`ALTER TABLE "service" ADD "allowedPaymentMethods" "public"."service_allowedpaymentmethods_enum" array NOT NULL DEFAULT '{PIX,CASH,CREDIT_CARD}'`);
        await queryRunner.query(`ALTER TABLE "charge_exception" ALTER COLUMN "newAmount" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "charge" ALTER COLUMN "amount" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "service" ALTER COLUMN "defaultPrice" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "enrollments" ALTER COLUMN "price" TYPE numeric`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "enrollments" ALTER COLUMN "price" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "service" ALTER COLUMN "defaultPrice" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "charge" ALTER COLUMN "amount" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "charge_exception" ALTER COLUMN "newAmount" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "allowedPaymentMethods"`);
        await queryRunner.query(`DROP TYPE "public"."service_allowedpaymentmethods_enum"`);
        await queryRunner.query(`ALTER TABLE "service" DROP COLUMN "address"`);
    }

}
