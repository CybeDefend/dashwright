import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule } from "@nestjs/throttler";
import { dataSourceOptions } from "./config/data-source";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { TestRunsModule } from "./test-runs/test-runs.module";
import { ArtifactsModule } from "./artifacts/artifacts.module";
import { IntegrationsModule } from "./integrations/integrations.module";
import { ApiKeysModule } from "./api-keys/api-keys.module";
import { InvitationsModule } from "./invitations/invitations.module";
import { AdminModule } from "./admin/admin.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        ...dataSourceOptions,
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get("RATE_LIMIT_TTL", 60) * 1000,
          limit: configService.get("RATE_LIMIT_MAX", 10),
        },
      ],
    }),
    AuthModule,
    UsersModule,
    TestRunsModule,
    ArtifactsModule,
    IntegrationsModule,
    ApiKeysModule,
    InvitationsModule,
    AdminModule,
  ],
})
export class AppModule {}
