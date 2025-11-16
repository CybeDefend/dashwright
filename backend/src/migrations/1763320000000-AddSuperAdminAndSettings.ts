import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSuperAdminAndSettings1763320000000
  implements MigrationInterface
{
  name = "AddSuperAdminAndSettings1763320000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add isSuperAdmin column to users table
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "is_super_admin" boolean NOT NULL DEFAULT false
    `);

    // Create system_settings table
    await queryRunner.query(`
      CREATE TABLE "system_settings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "key" varchar NOT NULL UNIQUE,
        "value" text NOT NULL,
        "description" text,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Insert default settings
    await queryRunner.query(`
      INSERT INTO "system_settings" ("key", "value", "description")
      VALUES 
        ('registration_enabled', 'true', 'Allow new user registrations'),
        ('system_version', '1.0.0', 'Current system version'),
        ('maintenance_mode', 'false', 'System maintenance mode')
    `);

    // Set the first user as super admin (only if users table exists and has data)
    const tableExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);

    if (tableExists[0].exists) {
      await queryRunner.query(`
        UPDATE "users" 
        SET "is_super_admin" = true 
        WHERE "id" = (
          SELECT "id" FROM "users" 
          ORDER BY "createdAt" ASC 
          LIMIT 1
        )
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "system_settings"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_super_admin"`);
  }
}
