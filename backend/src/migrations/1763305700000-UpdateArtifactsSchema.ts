import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateArtifactsSchema1763305700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove old columns
    await queryRunner.query(`ALTER TABLE "artifacts" DROP COLUMN IF EXISTS "path"`);
    await queryRunner.query(`ALTER TABLE "artifacts" DROP COLUMN IF EXISTS "metadata"`);

    // Add new columns
    await queryRunner.query(`ALTER TABLE "artifacts" ADD COLUMN "storageKey" TEXT NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "artifacts" ADD COLUMN "testName" VARCHAR(255)`);

    // Update type column to be an enum
    await queryRunner.query(`ALTER TABLE "artifacts" ALTER COLUMN "type" TYPE VARCHAR(50)`);

    // Update size column to be bigint
    await queryRunner.query(`ALTER TABLE "artifacts" ALTER COLUMN "size" TYPE BIGINT`);

    // Make mimeType NOT NULL
    await queryRunner.query(`ALTER TABLE "artifacts" ALTER COLUMN "mimeType" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove new columns
    await queryRunner.query(`ALTER TABLE "artifacts" DROP COLUMN IF EXISTS "testName"`);
    await queryRunner.query(`ALTER TABLE "artifacts" DROP COLUMN IF EXISTS "storageKey"`);

    // Add back old columns
    await queryRunner.query(`ALTER TABLE "artifacts" ADD COLUMN "path" VARCHAR NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "artifacts" ADD COLUMN "metadata" JSONB`);

    // Revert type changes
    await queryRunner.query(`ALTER TABLE "artifacts" ALTER COLUMN "size" TYPE INTEGER`);
    await queryRunner.query(`ALTER TABLE "artifacts" ALTER COLUMN "mimeType" DROP NOT NULL`);
  }
}
