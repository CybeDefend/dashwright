import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { TestRun, ApiKey, User } from "../entities";
import { TestRunsController } from "./test-runs.controller";
import { TestRunsService } from "./test-runs.service";
import { TestRunsGateway } from "./test-runs.gateway";
import { JwtOrApiKeyGuard } from "../common/guards/jwt-or-api-key.guard";

@Module({
  imports: [
    TypeOrmModule.forFeature([TestRun, ApiKey, User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || "your-secret-key",
      signOptions: { expiresIn: "1h" },
    }),
  ],
  controllers: [TestRunsController],
  providers: [TestRunsService, TestRunsGateway, JwtOrApiKeyGuard],
  exports: [TestRunsService, TestRunsGateway],
})
export class TestRunsModule {}
