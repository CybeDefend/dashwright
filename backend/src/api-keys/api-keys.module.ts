import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApiKeysController } from "./api-keys.controller";
import { ApiKeysService } from "./api-keys.service";
import { ApiKey } from "../entities/api-key.entity";
import { RolesGuard } from "../guards/roles.guard";

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey])],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, RolesGuard],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
