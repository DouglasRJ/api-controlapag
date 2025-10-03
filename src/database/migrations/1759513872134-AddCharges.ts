import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCharges1759513872134 implements MigrationInterface {
  name = 'AddCharges1759513872134';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."charge_status_enum" AS ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "charge" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" numeric NOT NULL, "dueDate" date NOT NULL, "status" "public"."charge_status_enum" NOT NULL DEFAULT 'PENDING', "paidAt" date, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "enrollmentId" uuid, CONSTRAINT "PK_ac0381acde3bdffe41ad57cd942" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "charge_exception" ALTER COLUMN "newAmount" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "service" ALTER COLUMN "defaultPrice" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ALTER COLUMN "price" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "charge" ADD CONSTRAINT "FK_4b788edc20f29ec7f34b3e8c571" FOREIGN KEY ("enrollmentId") REFERENCES "enrollments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "charge" DROP CONSTRAINT "FK_4b788edc20f29ec7f34b3e8c571"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ALTER COLUMN "price" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "service" ALTER COLUMN "defaultPrice" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "charge_exception" ALTER COLUMN "newAmount" TYPE numeric`,
    );
    await queryRunner.query(`DROP TABLE "charge"`);
    await queryRunner.query(`DROP TYPE "public"."charge_status_enum"`);
  }
}
