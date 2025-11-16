import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { TestRunsModule } from '../test-runs/test-runs.module';
import { ArtifactsModule } from '../artifacts/artifacts.module';
import { IntegrationsController } from './integrations.controller';
import { JwtOrApiKeyGuard } from '../common/guards/jwt-or-api-key.guard';
import { ApiKey } from '../entities/api-key.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TestRunsModule,
    ArtifactsModule,
    TypeOrmModule.forFeature([ApiKey, User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [IntegrationsController],
  providers: [JwtOrApiKeyGuard],
})
export class IntegrationsModule {}
