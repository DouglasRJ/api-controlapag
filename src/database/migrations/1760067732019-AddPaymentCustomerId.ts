import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentCustomerId1760067732019 implements MigrationInterface {
    name = 'AddPaymentCustomerId1760067732019'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "provider" ADD "paymentCustomerId" character varying`);
        await queryRunner.query(`ALTER TABLE "client" ADD "paymentCustomerId" character varying`);
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
        await queryRunner.query(`ALTER TABLE "client" DROP COLUMN "paymentCustomerId"`);
        await queryRunner.query(`ALTER TABLE "provider" DROP COLUMN "paymentCustomerId"`);
    }

}
