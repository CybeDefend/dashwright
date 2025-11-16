import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1763304308000 implements MigrationInterface {
  name = 'InitialSchema1763304308000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create organizations table
    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_organizations" PRIMARY KEY ("id")
      )
    `);

    // Create teams table
    await queryRunner.query(`
      CREATE TABLE "teams" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text,
        "organizationId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_teams" PRIMARY KEY ("id")
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "username" character varying NOT NULL,
        "email" character varying,
        "password" character varying NOT NULL,
        "fullName" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "lastLoginAt" TIMESTAMP,
        "organizationId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_username" UNIQUE ("username"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create user_roles table
    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "role" character varying NOT NULL,
        "userId" uuid NOT NULL,
        "scope" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_roles" PRIMARY KEY ("id")
      )
    `);

    // Create test_runs table
    await queryRunner.query(`
      CREATE TABLE "test_runs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'pending',
        "totalTests" integer NOT NULL DEFAULT 0,
        "passedTests" integer NOT NULL DEFAULT 0,
        "failedTests" integer NOT NULL DEFAULT 0,
        "skippedTests" integer NOT NULL DEFAULT 0,
        "duration" integer,
        "branch" character varying,
        "environment" character varying,
        "metadata" jsonb,
        "organizationId" uuid NOT NULL,
        "teamId" uuid,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_test_runs" PRIMARY KEY ("id")
      )
    `);

    // Create artifacts table
    await queryRunner.query(`
      CREATE TABLE "artifacts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "testRunId" uuid NOT NULL,
        "type" character varying NOT NULL,
        "filename" character varying NOT NULL,
        "path" character varying NOT NULL,
        "size" integer NOT NULL,
        "mimeType" character varying,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_artifacts" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "teams" 
      ADD CONSTRAINT "FK_teams_organization" 
      FOREIGN KEY ("organizationId") 
      REFERENCES "organizations"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD CONSTRAINT "FK_users_organization" 
      FOREIGN KEY ("organizationId") 
      REFERENCES "organizations"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "user_roles" 
      ADD CONSTRAINT "FK_user_roles_user" 
      FOREIGN KEY ("userId") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "test_runs" 
      ADD CONSTRAINT "FK_test_runs_organization" 
      FOREIGN KEY ("organizationId") 
      REFERENCES "organizations"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "test_runs" 
      ADD CONSTRAINT "FK_test_runs_team" 
      FOREIGN KEY ("teamId") 
      REFERENCES "teams"("id") 
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "test_runs" 
      ADD CONSTRAINT "FK_test_runs_user" 
      FOREIGN KEY ("userId") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "artifacts" 
      ADD CONSTRAINT "FK_artifacts_test_run" 
      FOREIGN KEY ("testRunId") 
      REFERENCES "test_runs"("id") 
      ON DELETE CASCADE
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_teams_organizationId" 
      ON "teams" ("organizationId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_organizationId" 
      ON "users" ("organizationId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_username" 
      ON "users" ("username")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_roles_userId" 
      ON "user_roles" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_test_runs_organizationId" 
      ON "test_runs" ("organizationId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_test_runs_teamId" 
      ON "test_runs" ("teamId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_test_runs_userId" 
      ON "test_runs" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_test_runs_status" 
      ON "test_runs" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_artifacts_testRunId" 
      ON "artifacts" ("testRunId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_artifacts_testRunId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_test_runs_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_test_runs_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_test_runs_teamId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_test_runs_organizationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_roles_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_username"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_organizationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_teams_organizationId"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "artifacts" DROP CONSTRAINT IF EXISTS "FK_artifacts_test_run"`);
    await queryRunner.query(`ALTER TABLE "test_runs" DROP CONSTRAINT IF EXISTS "FK_test_runs_user"`);
    await queryRunner.query(`ALTER TABLE "test_runs" DROP CONSTRAINT IF EXISTS "FK_test_runs_team"`);
    await queryRunner.query(`ALTER TABLE "test_runs" DROP CONSTRAINT IF EXISTS "FK_test_runs_organization"`);
    await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT IF EXISTS "FK_user_roles_user"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_organization"`);
    await queryRunner.query(`ALTER TABLE "teams" DROP CONSTRAINT IF EXISTS "FK_teams_organization"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "artifacts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "test_runs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "teams"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "organizations"`);
  }
}
