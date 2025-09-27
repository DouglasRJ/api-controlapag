import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProvider1758990165504 implements MigrationInterface {
  name = 'CreateProvider1758990165504';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."provider_status_enum" AS ENUM('ACTIVE', 'INACTIVE', 'PENDING_VERIFICATION', 'PENDING_PAYMENT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "provider" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "bio" text NOT NULL, "businessPhone" character varying NOT NULL, "status" "public"."provider_status_enum" NOT NULL DEFAULT 'PENDING_VERIFICATION', "address" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6ab2f66d8987bf1bfdd6136a2d5" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "provider"`);
    await queryRunner.query(`DROP TYPE "public"."provider_status_enum"`);
  }
}
