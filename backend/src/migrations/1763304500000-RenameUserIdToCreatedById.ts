import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameUserIdToCreatedById1763304500000 implements MigrationInterface {
  name = 'RenameUserIdToCreatedById1763304500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the existing foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "test_runs" 
      DROP CONSTRAINT IF EXISTS "FK_test_runs_user"
    `);

    // Drop the existing index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_test_runs_userId"
    `);

    // Rename the column
    await queryRunner.query(`
      ALTER TABLE "test_runs" 
      RENAME COLUMN "userId" TO "createdById"
    `);

    // Recreate the foreign key constraint with the new name
    await queryRunner.query(`
      ALTER TABLE "test_runs" 
      ADD CONSTRAINT "FK_test_runs_createdBy" 
      FOREIGN KEY ("createdById") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);

    // Recreate the index with the new name
    await queryRunner.query(`
      CREATE INDEX "IDX_test_runs_createdById" 
      ON "test_runs" ("createdById")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the new foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "test_runs" 
      DROP CONSTRAINT IF EXISTS "FK_test_runs_createdBy"
    `);

    // Drop the new index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_test_runs_createdById"
    `);

    // Rename the column back
    await queryRunner.query(`
      ALTER TABLE "test_runs" 
      RENAME COLUMN "createdById" TO "userId"
    `);

    // Recreate the original foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "test_runs" 
      ADD CONSTRAINT "FK_test_runs_user" 
      FOREIGN KEY ("userId") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);

    // Recreate the original index
    await queryRunner.query(`
      CREATE INDEX "IDX_test_runs_userId" 
      ON "test_runs" ("userId")
    `);
  }
}
