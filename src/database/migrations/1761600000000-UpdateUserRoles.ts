import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserRoles1761600000000 implements MigrationInterface {
  name = 'UpdateUserRoles1761600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar novos valores ao enum
    // PostgreSQL requer commit após adicionar valores de enum antes de usá-los
    // Verificamos se o valor já existe antes de adicionar
    const checkEnumValue = async (value: string) => {
      const result = await queryRunner.query(
        `
        SELECT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = $1 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role_enum')
        ) as exists
      `,
        [value],
      );
      return result[0]?.exists === true;
    };

    // Adicionar INDIVIDUAL se não existir
    if (!(await checkEnumValue('INDIVIDUAL'))) {
      await queryRunner.query(
        `ALTER TYPE "public"."user_role_enum" ADD VALUE 'INDIVIDUAL'`,
      );
      // Commit explícito necessário para usar o novo valor
      await queryRunner.commitTransaction();
      await queryRunner.startTransaction();
    }

    // Adicionar MASTER se não existir
    if (!(await checkEnumValue('MASTER'))) {
      await queryRunner.query(
        `ALTER TYPE "public"."user_role_enum" ADD VALUE 'MASTER'`,
      );
      // Commit explícito necessário para usar o novo valor
      await queryRunner.commitTransaction();
      await queryRunner.startTransaction();
    }

    // Adicionar SUB_PROVIDER se não existir
    if (!(await checkEnumValue('SUB_PROVIDER'))) {
      await queryRunner.query(
        `ALTER TYPE "public"."user_role_enum" ADD VALUE 'SUB_PROVIDER'`,
      );
      // Commit explícito necessário para usar o novo valor
      await queryRunner.commitTransaction();
      await queryRunner.startTransaction();
    }

    // Agora podemos usar os novos valores do enum
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
