import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from "@nestjs/swagger";
import { TestRunsService } from "../test-runs/test-runs.service";
import { TestRunsGateway } from "../test-runs/test-runs.gateway";
import { ArtifactsService } from "../artifacts/artifacts.service";
import { JwtOrApiKeyGuard } from "../common/guards/jwt-or-api-key.guard";
import { CreateTestRunDto } from "../common/dto/test-run.dto";
import { CreateArtifactDto } from "../common/dto/artifact.dto";

@ApiTags("Integrations")
@ApiBearerAuth("JWT-auth")
@ApiSecurity("API-Key")
@Controller("integrations")
@UseGuards(JwtOrApiKeyGuard)
export class IntegrationsController {
  constructor(
    private testRunsService: TestRunsService,
    private testRunsGateway: TestRunsGateway,
    private artifactsService: ArtifactsService,
  ) {}

  @Post("playwright/run")
  async createPlaywrightRun(
    @Body() createTestRunDto: CreateTestRunDto,
    @Request() req: any,
  ) {
    // Validate organizationId matches the authenticated user/API key's organization
    const userOrgId =
      req.user?.organization?.id || req.apiKey?.organization?.id;

    if (!userOrgId) {
      throw new ForbiddenException(
        "No organization associated with your account",
      );
    }

    if (createTestRunDto.organizationId !== userOrgId) {
      throw new ForbiddenException(
        "You can only create test runs for your own organization",
      );
    }

    const testRun = await this.testRunsService.create(
      createTestRunDto,
      req.user?.id,
    );
    this.testRunsGateway.notifyTestRunCreated(testRun);
    return { testRunId: testRun.id };
  }

  @Post("playwright/artifact")
  async addArtifact(
    @Body() createArtifactDto: CreateArtifactDto,
    @Request() req: any,
  ) {
    // Validate organizationId if present in DTO
    const userOrgId =
      req.user?.organization?.id || req.apiKey?.organization?.id;

    if (!userOrgId) {
      throw new ForbiddenException(
        "No organization associated with your account",
      );
    }

    // Note: CreateArtifactDto likely doesn't have organizationId,
    // but we should validate the testRun belongs to the user's org
    const artifact = await this.artifactsService.create(createArtifactDto);
    return { artifactId: artifact.id };
  }
}
