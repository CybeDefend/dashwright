import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminController } from "../controllers/admin.controller";
import { User } from "../entities/user.entity";
import { Organization } from "../entities/organization.entity";
import { TestRun } from "../entities/test-run.entity";
import { SystemSetting } from "../entities/system-setting.entity";
import { SystemSettingsService } from "../services/system-settings.service";
import { SuperAdminGuard } from "../guards/super-admin.guard";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Organization, TestRun, SystemSetting]),
  ],
  controllers: [AdminController],
  providers: [SystemSettingsService, SuperAdminGuard],
  exports: [SystemSettingsService],
})
export class AdminModule {}
