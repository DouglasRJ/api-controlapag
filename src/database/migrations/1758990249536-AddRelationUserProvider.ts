import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRelationUserProvider1758990249536
  implements MigrationInterface
{
  name = 'AddRelationUserProvider1758990249536';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "provider" ADD "userId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "provider" ADD CONSTRAINT "UQ_da1c78142007c621b5498c818c1" UNIQUE ("userId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider" ADD CONSTRAINT "FK_da1c78142007c621b5498c818c1" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "provider" DROP CONSTRAINT "FK_da1c78142007c621b5498c818c1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "provider" DROP CONSTRAINT "UQ_da1c78142007c621b5498c818c1"`,
    );
    await queryRunner.query(`ALTER TABLE "provider" DROP COLUMN "userId"`);
  }
}
