import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminController } from "../controllers/admin.controller";
import { User } from "../entities/user.entity";
import { Organization } from "../entities/organization.entity";
import { TestRun } from "../entities/test-run.entity";
import { SystemSetting } from "../entities/system-setting.entity";
import { Invitation } from "../entities/invitation.entity";
import { SystemSettingsService } from "../services/system-settings.service";
import { SuperAdminGuard } from "../guards/super-admin.guard";
import { ArtifactsModule } from "../artifacts/artifacts.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Organization,
      TestRun,
      SystemSetting,
      Invitation,
    ]),
    ArtifactsModule,
  ],
  controllers: [AdminController],
  providers: [SystemSettingsService, SuperAdminGuard],
  exports: [SystemSettingsService],
})
export class AdminModule {}
