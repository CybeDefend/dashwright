import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { TestRunsService } from '../test-runs/test-runs.service';
import { TestRunsGateway } from '../test-runs/test-runs.gateway';
import { ArtifactsService } from '../artifacts/artifacts.service';
import { JwtOrApiKeyGuard } from '../common/guards/jwt-or-api-key.guard';
import { CreateTestRunDto } from '../common/dto/test-run.dto';
import { CreateArtifactDto } from '../common/dto/artifact.dto';

@ApiTags('Integrations')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('API-Key')
@Controller('integrations')
@UseGuards(JwtOrApiKeyGuard)
export class IntegrationsController {
  constructor(
    private testRunsService: TestRunsService,
    private testRunsGateway: TestRunsGateway,
    private artifactsService: ArtifactsService,
  ) {}

  @Post('playwright/run')
  async createPlaywrightRun(@Body() createTestRunDto: CreateTestRunDto) {
    const testRun = await this.testRunsService.create(createTestRunDto);
    this.testRunsGateway.notifyTestRunCreated(testRun);
    return { testRunId: testRun.id };
  }

  @Post('playwright/artifact')
  async addArtifact(@Body() createArtifactDto: CreateArtifactDto) {
    const artifact = await this.artifactsService.create(createArtifactDto);
    return { artifactId: artifact.id };
  }
}
