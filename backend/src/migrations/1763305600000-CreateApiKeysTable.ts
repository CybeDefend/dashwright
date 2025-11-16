import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateApiKeysTable1763305600000 implements MigrationInterface {
  name = 'CreateApiKeysTable1763305600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "api_keys" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "key" character varying NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "lastUsedAt" TIMESTAMP,
        "expiresAt" TIMESTAMP,
        "userId" uuid NOT NULL,
        "organizationId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_api_keys_key" UNIQUE ("key"),
        CONSTRAINT "PK_api_keys" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "api_keys" 
      ADD CONSTRAINT "FK_api_keys_user" 
      FOREIGN KEY ("userId") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "api_keys" 
      ADD CONSTRAINT "FK_api_keys_organization" 
      FOREIGN KEY ("organizationId") 
      REFERENCES "organizations"("id") 
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_api_keys_userId" 
      ON "api_keys" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_api_keys_organizationId" 
      ON "api_keys" ("organizationId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_api_keys_key" 
      ON "api_keys" ("key")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_api_keys_key"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_api_keys_organizationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_api_keys_userId"`);
    await queryRunner.query(`ALTER TABLE "api_keys" DROP CONSTRAINT IF EXISTS "FK_api_keys_organization"`);
    await queryRunner.query(`ALTER TABLE "api_keys" DROP CONSTRAINT IF EXISTS "FK_api_keys_user"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "api_keys"`);
  }
}
