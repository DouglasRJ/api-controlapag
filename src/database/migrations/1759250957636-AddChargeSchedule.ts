import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChargeSchedule1759250957636 implements MigrationInterface {
    name = 'AddChargeSchedule1759250957636'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."charge_schedule_billingmodel_enum" AS ENUM('RECURRING', 'ONE_TIME')`);
        await queryRunner.query(`CREATE TYPE "public"."charge_schedule_recurrenceinterval_enum" AS ENUM('WEEKLY', 'MONTHLY', 'BIMONTHLY', 'TRIMESTERLY', 'SEMIANNUALLY', 'YEARLY')`);
        await queryRunner.query(`CREATE TABLE "charge_schedule" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "billingModel" "public"."charge_schedule_billingmodel_enum" NOT NULL, "recurrenceInterval" "public"."charge_schedule_recurrenceinterval_enum", "chargeDay" integer NOT NULL, "dueDate" date, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "enrollmentId" uuid, CONSTRAINT "REL_338ef6d9bbddabf5547e9995a8" UNIQUE ("enrollmentId"), CONSTRAINT "PK_d8b05dea0cc911a0a3e1c5b73a6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "service" ALTER COLUMN "defaultPrice" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "enrollments" ALTER COLUMN "price" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "charge_schedule" ADD CONSTRAINT "FK_338ef6d9bbddabf5547e9995a82" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "charge_schedule" DROP CONSTRAINT "FK_338ef6d9bbddabf5547e9995a82"`);
        await queryRunner.query(`ALTER TABLE "enrollments" ALTER COLUMN "price" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "service" ALTER COLUMN "defaultPrice" TYPE numeric`);
        await queryRunner.query(`DROP TABLE "charge_schedule"`);
        await queryRunner.query(`DROP TYPE "public"."charge_schedule_recurrenceinterval_enum"`);
        await queryRunner.query(`DROP TYPE "public"."charge_schedule_billingmodel_enum"`);
    }

}
