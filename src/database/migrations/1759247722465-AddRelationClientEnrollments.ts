import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRelationClientEnrollments1759247722465
  implements MigrationInterface
{
  name = 'AddRelationClientEnrollments1759247722465';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "enrollments" ADD "clientId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "service" ALTER COLUMN "defaultPrice" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ALTER COLUMN "price" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "FK_36f0badbdac3d76366ba3dfe4a6" FOREIGN KEY ("clientId") REFERENCES "client"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT "FK_36f0badbdac3d76366ba3dfe4a6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ALTER COLUMN "price" TYPE numeric`,
    );
    await queryRunner.query(
      `ALTER TABLE "service" ALTER COLUMN "defaultPrice" TYPE numeric`,
    );
    await queryRunner.query(`ALTER TABLE "enrollments" DROP COLUMN "clientId"`);
  }
}
