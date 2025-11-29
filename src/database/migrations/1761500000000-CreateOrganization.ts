import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganization1761500000000 implements MigrationInterface {
  name = 'CreateOrganization1761500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela organization
    await queryRunner.query(
      `CREATE TABLE "organization" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "ownerId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_organization" PRIMARY KEY ("id")
      )`,
    );

    // Criar foreign key para ownerId -> user.id
    await queryRunner.query(
      `ALTER TABLE "organization" ADD CONSTRAINT "FK_organization_ownerId" 
       FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // Criar índice para ownerId (performance)
    await queryRunner.query(
      `CREATE INDEX "IDX_organization_ownerId" ON "organization" ("ownerId")`,
    );

    // Adicionar organizationId na tabela user (nullable)
    await queryRunner.query(
      `ALTER TABLE "user" ADD COLUMN "organizationId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD CONSTRAINT "FK_user_organizationId" 
       FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_organizationId" ON "user" ("organizationId")`,
    );

    // Adicionar organizationId na tabela enrollments (nullable)
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD COLUMN "organizationId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "FK_enrollments_organizationId" 
       FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_enrollments_organizationId" ON "enrollments" ("organizationId")`,
    );

    // Adicionar organizationId na tabela charge (nullable)
    await queryRunner.query(
      `ALTER TABLE "charge" ADD COLUMN "organizationId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "charge" ADD CONSTRAINT "FK_charge_organizationId" 
       FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_charge_organizationId" ON "charge" ("organizationId")`,
    );

    // Adicionar organizationId na tabela client (nullable)
    await queryRunner.query(
      `ALTER TABLE "client" ADD COLUMN "organizationId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "client" ADD CONSTRAINT "FK_client_organizationId" 
       FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_client_organizationId" ON "client" ("organizationId")`,
    );

    // Adicionar organizationId na tabela service (nullable)
    await queryRunner.query(
      `ALTER TABLE "service" ADD COLUMN "organizationId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "service" ADD CONSTRAINT "FK_service_organizationId" 
       FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_service_organizationId" ON "service" ("organizationId")`,
    );

    // Adicionar organizationId na tabela provider (nullable)
    await queryRunner.query(
      `ALTER TABLE "provider" ADD COLUMN "organizationId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider" ADD CONSTRAINT "FK_provider_organizationId" 
       FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_provider_organizationId" ON "provider" ("organizationId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_provider_organizationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_service_organizationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_client_organizationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_charge_organizationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_enrollments_organizationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_organizationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_organization_ownerId"`);

    // Remover foreign keys
    await queryRunner.query(
      `ALTER TABLE "provider" DROP CONSTRAINT IF EXISTS "FK_provider_organizationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "service" DROP CONSTRAINT IF EXISTS "FK_service_organizationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "client" DROP CONSTRAINT IF EXISTS "FK_client_organizationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "charge" DROP CONSTRAINT IF EXISTS "FK_charge_organizationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "FK_enrollments_organizationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "FK_user_organizationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP CONSTRAINT IF EXISTS "FK_organization_ownerId"`,
    );

    // Remover colunas
    await queryRunner.query(`ALTER TABLE "provider" DROP COLUMN IF EXISTS "organizationId"`);
    await queryRunner.query(`ALTER TABLE "service" DROP COLUMN IF EXISTS "organizationId"`);
    await queryRunner.query(`ALTER TABLE "client" DROP COLUMN IF EXISTS "organizationId"`);
    await queryRunner.query(`ALTER TABLE "charge" DROP COLUMN IF EXISTS "organizationId"`);
    await queryRunner.query(`ALTER TABLE "enrollments" DROP COLUMN IF EXISTS "organizationId"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "organizationId"`);

    // Remover tabela organization
    await queryRunner.query(`DROP TABLE IF EXISTS "organization"`);
  }
}
