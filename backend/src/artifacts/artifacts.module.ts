import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { Artifact, ApiKey, User } from "../entities";
import { ArtifactsController } from "./artifacts.controller";
import { ArtifactsService } from "./artifacts.service";
import { StorageService } from "./storage.service";
import { JwtOrApiKeyGuard } from "../common/guards/jwt-or-api-key.guard";

@Module({
  imports: [
    TypeOrmModule.forFeature([Artifact, ApiKey, User]),
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "your-secret-key",
      signOptions: { expiresIn: "1h" },
    }),
  ],
  controllers: [ArtifactsController],
  providers: [ArtifactsService, StorageService, JwtOrApiKeyGuard],
  exports: [ArtifactsService, StorageService],
})
export class ArtifactsModule {}
