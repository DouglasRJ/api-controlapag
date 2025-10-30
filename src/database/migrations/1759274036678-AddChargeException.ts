import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChargeException1759274036678 implements MigrationInterface {
  name = 'AddChargeException1759274036678';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."charge_exception_action_enum" AS ENUM('SKIP', 'POSTPONE', 'MODIFY_AMOUNT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "charge_exception" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "originalChargeDate" date NOT NULL, "action" "public"."charge_exception_action_enum" NOT NULL, "newDueDate" date, "newAmount" numeric, "reason" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "enrollmentId" uuid, CONSTRAINT "PK_1c4c034314d86b5bd567a5678b7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "service" ALTER COLUMN "defaultPrice" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ALTER COLUMN "price" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "charge_exception" ADD CONSTRAINT "FK_325649d1a883f7dfedc768998a9" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "charge_exception" DROP CONSTRAINT "FK_325649d1a883f7dfedc768998a9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ALTER COLUMN "price" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "service" ALTER COLUMN "defaultPrice" TYPE numeric`,
    );
    await queryRunner.query(`DROP TABLE "charge_exception"`);
    await queryRunner.query(
      `DROP TYPE "public"."charge_exception_action_enum"`,
    );
  }
}
