import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRelationUserClient1758998114023 implements MigrationInterface {
  name = 'AddRelationUserClient1758998114023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "client" ADD "userId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "client" ADD CONSTRAINT "UQ_ad3b4bf8dd18a1d467c5c0fc13a" UNIQUE ("userId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "client" ADD CONSTRAINT "FK_ad3b4bf8dd18a1d467c5c0fc13a" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "client" DROP CONSTRAINT "FK_ad3b4bf8dd18a1d467c5c0fc13a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "client" DROP CONSTRAINT "UQ_ad3b4bf8dd18a1d467c5c0fc13a"`,
    );
    await queryRunner.query(`ALTER TABLE "client" DROP COLUMN "userId"`);
  }
}
