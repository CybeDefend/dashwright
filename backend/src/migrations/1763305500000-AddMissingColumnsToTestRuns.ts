import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingColumnsToTestRuns1763305500000
  implements MigrationInterface
{
  name = "AddMissingColumnsToTestRuns1763305500000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add missing columns to test_runs table
    await queryRunner.query(`
      ALTER TABLE "test_runs" 
      ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP
    `);

    await queryRunner.query(`
      ALTER TABLE "test_runs" 
      ADD COLUMN IF NOT EXISTS "finishedAt" TIMESTAMP
    `);

    await queryRunner.query(`
      ALTER TABLE "test_runs" 
      ADD COLUMN IF NOT EXISTS "logs" TEXT
    `);

    await queryRunner.query(`
      ALTER TABLE "test_runs" 
      ADD COLUMN IF NOT EXISTS "commit" character varying(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "test_runs" 
      DROP COLUMN IF EXISTS "commit"
    `);

    await queryRunner.query(`
      ALTER TABLE "test_runs" 
      DROP COLUMN IF EXISTS "logs"
    `);

    await queryRunner.query(`
      ALTER TABLE "test_runs" 
      DROP COLUMN IF EXISTS "finishedAt"
    `);

    await queryRunner.query(`
      ALTER TABLE "test_runs" 
      DROP COLUMN IF EXISTS "startedAt"
    `);
  }
}
