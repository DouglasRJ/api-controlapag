import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefundFieldsToCharge1761700000000
  implements MigrationInterface
{
  name = 'AddRefundFieldsToCharge1761700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar novos valores ao enum charge_status_enum
    await queryRunner.query(
      `ALTER TYPE "public"."charge_status_enum" ADD VALUE IF NOT EXISTS 'REFUNDED'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."charge_status_enum" ADD VALUE IF NOT EXISTS 'PARTIALLY_REFUNDED'`,
    );

    // Adicionar coluna refundedAmount
    await queryRunner.query(
      `ALTER TABLE "charge" ADD COLUMN IF NOT EXISTS "refundedAmount" numeric(10,2)`,
    );

    // Adicionar coluna paymentGatewayId
    await queryRunner.query(
      `ALTER TABLE "charge" ADD COLUMN IF NOT EXISTS "paymentGatewayId" character varying`,
    );

    // Adicionar coluna paymentLink
    await queryRunner.query(
      `ALTER TABLE "charge" ADD COLUMN IF NOT EXISTS "paymentLink" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover colunas
    await queryRunner.query(
      `ALTER TABLE "charge" DROP COLUMN IF EXISTS "paymentLink"`,
    );
    await queryRunner.query(
      `ALTER TABLE "charge" DROP COLUMN IF EXISTS "paymentGatewayId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "charge" DROP COLUMN IF EXISTS "refundedAmount"`,
    );

    // PostgreSQL não permite remover valores de enum diretamente
    // Seria necessário recriar o enum, mas isso é complexo e pode causar problemas
    // Por isso, apenas removemos as colunas, mantendo o enum com os novos valores
    // Em produção, seria necessário uma abordagem mais cuidadosa
  }
}

