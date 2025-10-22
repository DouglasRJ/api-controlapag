import { MigrationInterface, QueryRunner } from "typeorm";

export class AddServiceSchedule1761104791363 implements MigrationInterface {
    name = 'AddServiceSchedule1761104791363'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."service_schedule_frequency_enum" AS ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM_DAYS')`);
        await queryRunner.query(`CREATE TABLE "service_schedule" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "frequency" "public"."service_schedule_frequency_enum" NOT NULL, "daysOfWeek" text, "dayOfMonth" integer, "startTime" TIME, "endTime" TIME, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "enrollmentId" uuid, CONSTRAINT "REL_5c88fc655130f04c30cf7c70e4" UNIQUE ("enrollmentId"), CONSTRAINT "PK_1c88a057ca24f3311e12ae2d0f2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "charge_exception" ALTER COLUMN "newAmount" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "charge" ALTER COLUMN "amount" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "service" ALTER COLUMN "defaultPrice" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "enrollments" ALTER COLUMN "price" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "service_schedule" ADD CONSTRAINT "FK_5c88fc655130f04c30cf7c70e48" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_schedule" DROP CONSTRAINT "FK_5c88fc655130f04c30cf7c70e48"`);
        await queryRunner.query(`ALTER TABLE "enrollments" ALTER COLUMN "price" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "service" ALTER COLUMN "defaultPrice" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "charge" ALTER COLUMN "amount" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "charge_exception" ALTER COLUMN "newAmount" TYPE numeric`);
        await queryRunner.query(`DROP TABLE "service_schedule"`);
        await queryRunner.query(`DROP TYPE "public"."service_schedule_frequency_enum"`);
    }

}
