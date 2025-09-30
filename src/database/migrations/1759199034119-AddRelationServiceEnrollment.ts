import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRelationServiceEnrollment1759199034119 implements MigrationInterface {
    name = 'AddRelationServiceEnrollment1759199034119'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."enrollments_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'CANCELLED', 'COMPLETED')`);
        await queryRunner.query(`CREATE TABLE "enrollments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "price" numeric NOT NULL, "startDate" date NOT NULL, "endDate" date, "status" "public"."enrollments_status_enum" NOT NULL DEFAULT 'ACTIVE', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "serviceId" uuid, CONSTRAINT "PK_7c0f752f9fb68bf6ed7367ab00f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "service" ALTER COLUMN "defaultPrice" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "enrollments" ADD CONSTRAINT "FK_613b4da8e0ca9298902baca8294" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "enrollments" DROP CONSTRAINT "FK_613b4da8e0ca9298902baca8294"`);
        await queryRunner.query(`ALTER TABLE "service" ALTER COLUMN "defaultPrice" TYPE numeric`);
        await queryRunner.query(`DROP TABLE "enrollments"`);
        await queryRunner.query(`DROP TYPE "public"."enrollments_status_enum"`);
    }

}
