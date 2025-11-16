import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInvitationsTable1763305800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE invitation_status_enum AS ENUM ('pending', 'accepted', 'expired', 'revoked');
    `);

    await queryRunner.query(`
      CREATE TYPE user_role_enum AS ENUM ('admin', 'maintainer', 'viewer');
    `);

    await queryRunner.query(`
      CREATE TABLE "invitations" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "token" VARCHAR(255) UNIQUE NOT NULL,
        "email" VARCHAR(255) NOT NULL,
        "role" user_role_enum NOT NULL DEFAULT 'viewer',
        "status" invitation_status_enum NOT NULL DEFAULT 'pending',
        "expiresAt" TIMESTAMP NOT NULL,
        "organizationId" UUID NOT NULL,
        "invitedById" UUID,
        "acceptedByUserId" UUID,
        "acceptedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "FK_invitations_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_invitations_invitedBy" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_invitations_acceptedByUser" FOREIGN KEY ("acceptedByUserId") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invitations_token" ON "invitations"("token");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invitations_email" ON "invitations"("email");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invitations_organizationId" ON "invitations"("organizationId");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_invitations_status" ON "invitations"("status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_invitations_status"`);
    await queryRunner.query(`DROP INDEX "IDX_invitations_organizationId"`);
    await queryRunner.query(`DROP INDEX "IDX_invitations_email"`);
    await queryRunner.query(`DROP INDEX "IDX_invitations_token"`);
    await queryRunner.query(`DROP TABLE "invitations"`);
    await queryRunner.query(`DROP TYPE user_role_enum`);
    await queryRunner.query(`DROP TYPE invitation_status_enum`);
  }
}
