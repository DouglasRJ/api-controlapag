import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInDisputeStatusToCharge1761800000000
  implements MigrationInterface
{
  name = 'AddInDisputeStatusToCharge1761800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar novo valor ao enum charge_status_enum
    await queryRunner.query(
      `ALTER TYPE "public"."charge_status_enum" ADD VALUE IF NOT EXISTS 'IN_DISPUTE'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL não permite remover valores de enum diretamente
    // Seria necessário recriar o enum, mas isso é complexo e pode causar problemas
    // Por isso, apenas mantemos o enum com o novo valor
    // Em produção, seria necessário uma abordagem mais cuidadosa
  }
}

