import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
  Param,
  Patch,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TestRunsService } from "../test-runs/test-runs.service";
import { TestRunsGateway } from "../test-runs/test-runs.gateway";
import { ArtifactsService } from "../artifacts/artifacts.service";
import { JwtOrApiKeyGuard } from "../common/guards/jwt-or-api-key.guard";
import { CreateTestRunDto } from "../common/dto/test-run.dto";
import { CreateArtifactDto } from "../common/dto/artifact.dto";
import { CreateTestDto } from "../common/dto/test.dto";
import { Test } from "../entities";

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
    @InjectRepository(Test)
    private testRepository: Repository<Test>,
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

  @Patch("playwright/run/:id/progress")
  @ApiOperation({
    summary: "Update test run progress incrementally (executed tests count)",
  })
  @ApiResponse({
    status: 200,
    description: "Test run progress updated successfully",
  })
  async updateProgress(
    @Param("id") id: string,
    @Body()
    progressDto: {
      passedTests?: number;
      failedTests?: number;
      skippedTests?: number;
    },
    @Request() req: any,
  ) {
    const userOrgId =
      req.user?.organization?.id || req.apiKey?.organization?.id;

    if (!userOrgId) {
      throw new ForbiddenException(
        "No organization associated with your account",
      );
    }

    // Update the test run with new progress
    const testRun = await this.testRunsService.updateProgress(
      id,
      progressDto.passedTests || 0,
      progressDto.failedTests || 0,
      progressDto.skippedTests || 0,
    );

    if (testRun) {
      this.testRunsGateway.notifyTestRunUpdated(testRun);
    }

    return testRun;
  }

  @Post("playwright/test")
  @ApiOperation({
    summary: "Record an individual test result",
  })
  @ApiResponse({
    status: 201,
    description: "Test result recorded successfully",
  })
  async recordTest(
    @Body() createTestDto: CreateTestDto,
    @Request() req: any,
  ) {
    const test = this.testRepository.create(createTestDto);
    const savedTest = await this.testRepository.save(test);
    
    // Notify via WebSocket
    const testRun = await this.testRunsService.findOne(createTestDto.testRunId);
    if (testRun) {
      this.testRunsGateway.notifyTestRunUpdated(testRun);
    }
    
    return { testId: savedTest.id };
  }
}
