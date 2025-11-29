import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBillingTypeAndPauseDatesToEnrollments1761900000000
  implements MigrationInterface
{
  name = 'AddBillingTypeAndPauseDatesToEnrollments1761900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar novo valor PAUSED ao enum enrollments_status_enum
    await queryRunner.query(
      `ALTER TYPE "public"."enrollments_status_enum" ADD VALUE IF NOT EXISTS 'PAUSED'`,
    );

    // Criar enum billing_type_enum
    await queryRunner.query(
      `CREATE TYPE "public"."billing_type_enum" AS ENUM('UNIQUE', 'INSTALLMENT', 'RECURRING')`,
    );

    // Adicionar coluna billingType
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD COLUMN "billingType" "public"."billing_type_enum"`,
    );

    // Adicionar coluna pauseStartDate
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD COLUMN "pauseStartDate" date`,
    );

    // Adicionar coluna pauseEndDate
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD COLUMN "pauseEndDate" date`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover colunas
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP COLUMN IF EXISTS "pauseEndDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP COLUMN IF EXISTS "pauseStartDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP COLUMN IF EXISTS "billingType"`,
    );

    // Remover enum (PostgreSQL não permite remover valores de enum diretamente)
    // O enum será mantido, mas não será usado
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."billing_type_enum"`);

    // PostgreSQL não permite remover valores de enum diretamente
    // O valor PAUSED será mantido no enum
  }
}

