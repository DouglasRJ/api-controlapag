import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeRelationSchedule1761425006480 implements MigrationInterface {
    name = 'ChangeRelationSchedule1761425006480'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "charge_exception" ALTER COLUMN "newAmount" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "charge" ALTER COLUMN "amount" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "service_schedule" DROP CONSTRAINT "FK_5c88fc655130f04c30cf7c70e48"`);
        await queryRunner.query(`ALTER TABLE "service_schedule" ALTER COLUMN "enrollmentId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "service_schedule" DROP CONSTRAINT "REL_5c88fc655130f04c30cf7c70e4"`);
        await queryRunner.query(`ALTER TABLE "service" ALTER COLUMN "defaultPrice" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "enrollments" ALTER COLUMN "price" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "service_schedule" ADD CONSTRAINT "FK_5c88fc655130f04c30cf7c70e48" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_schedule" DROP CONSTRAINT "FK_5c88fc655130f04c30cf7c70e48"`);
        await queryRunner.query(`ALTER TABLE "enrollments" ALTER COLUMN "price" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "service" ALTER COLUMN "defaultPrice" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "service_schedule" ADD CONSTRAINT "REL_5c88fc655130f04c30cf7c70e4" UNIQUE ("enrollmentId")`);
        await queryRunner.query(`ALTER TABLE "service_schedule" ALTER COLUMN "enrollmentId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "service_schedule" ADD CONSTRAINT "FK_5c88fc655130f04c30cf7c70e48" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "charge" ALTER COLUMN "amount" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "charge_exception" ALTER COLUMN "newAmount" TYPE numeric`);
    }

}
