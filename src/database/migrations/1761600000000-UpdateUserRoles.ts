import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserRoles1761600000000 implements MigrationInterface {
  name = 'UpdateUserRoles1761600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar novos valores ao enum
    await queryRunner.query(
      `ALTER TYPE "public"."user_role_enum" ADD VALUE 'INDIVIDUAL'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."user_role_enum" ADD VALUE 'MASTER'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."user_role_enum" ADD VALUE 'SUB_PROVIDER'`,
    );

    // Migrar usuários existentes:
    // PROVIDER com organizationId -> MASTER
    // PROVIDER sem organizationId -> INDIVIDUAL
    await queryRunner.query(`
      UPDATE "user" 
      SET "role" = 'MASTER' 
      WHERE "role" = 'PROVIDER' AND "organizationId" IS NOT NULL
    `);

    await queryRunner.query(`
      UPDATE "user" 
      SET "role" = 'INDIVIDUAL' 
      WHERE "role" = 'PROVIDER' AND "organizationId" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter migração: MASTER e INDIVIDUAL -> PROVIDER
    await queryRunner.query(`
      UPDATE "user" 
      SET "role" = 'PROVIDER' 
      WHERE "role" IN ('MASTER', 'INDIVIDUAL')
    `);

    // Remover valores do enum (PostgreSQL não permite remover valores de enum diretamente)
    // Seria necessário recriar o enum, mas isso é complexo e pode causar problemas
    // Por isso, apenas revertemos os dados, mantendo o enum com os novos valores
    // Em produção, seria necessário uma abordagem mais cuidadosa
  }
}

