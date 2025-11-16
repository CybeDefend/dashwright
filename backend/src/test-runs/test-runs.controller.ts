import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { TestRunsService } from "./test-runs.service";
import { TestRunsGateway } from "./test-runs.gateway";
import { CreateTestRunDto, UpdateTestRunDto } from "../common/dto/test-run.dto";
import { JwtOrApiKeyGuard } from "../common/guards/jwt-or-api-key.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { User, TestRunStatus } from "../entities";

@ApiTags("Test Runs")
@ApiBearerAuth("JWT-auth")
@ApiSecurity("API-Key")
@Controller("test-runs")
@UseGuards(JwtOrApiKeyGuard)
export class TestRunsController {
  constructor(
    private testRunsService: TestRunsService,
    private testRunsGateway: TestRunsGateway,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a new test run" })
  @ApiResponse({ status: 201, description: "Test run successfully created" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async create(
    @Body() createTestRunDto: CreateTestRunDto,
    @CurrentUser() user: User,
  ) {
    const testRun = await this.testRunsService.create(
      createTestRunDto,
      user.id,
    );
    this.testRunsGateway.notifyTestRunCreated(testRun);
    return testRun;
  }

  @Get()
  @ApiOperation({ summary: "Get all test runs" })
  @ApiQuery({
    name: "organizationId",
    required: false,
    description: "Filter by organization ID",
  })
  @ApiResponse({
    status: 200,
    description: "List of test runs retrieved successfully",
  })
  findAll(@Query("organizationId") organizationId?: string) {
    return this.testRunsService.findAll(organizationId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a test run by ID" })
  @ApiParam({ name: "id", description: "Test run UUID" })
  @ApiResponse({ status: 200, description: "Test run retrieved successfully" })
  @ApiResponse({ status: 404, description: "Test run not found" })
  findOne(@Param("id") id: string) {
    return this.testRunsService.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a test run" })
  @ApiParam({ name: "id", description: "Test run UUID" })
  @ApiResponse({ status: 200, description: "Test run successfully updated" })
  @ApiResponse({ status: 404, description: "Test run not found" })
  async update(
    @Param("id") id: string,
    @Body() updateTestRunDto: UpdateTestRunDto,
  ) {
    const testRun = await this.testRunsService.update(id, updateTestRunDto);
    if (testRun) {
      this.testRunsGateway.notifyTestRunUpdated(testRun);
    }
    return testRun;
  }

  @Put(":id/force-fail")
  @ApiOperation({ summary: "Force a test run to failed status" })
  @ApiParam({ name: "id", description: "Test run UUID" })
  @ApiResponse({ status: 200, description: "Test run marked as failed" })
  @ApiResponse({ status: 404, description: "Test run not found" })
  async forceFail(@Param("id") id: string) {
    const testRun = await this.testRunsService.update(id, {
      status: TestRunStatus.FAILED,
      finishedAt: new Date().toISOString(),
    });
    if (testRun) {
      this.testRunsGateway.notifyTestRunUpdated(testRun);
    }
    return testRun;
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.testRunsService.remove(id);
  }
}
