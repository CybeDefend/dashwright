import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  IsObject,
  IsDateString,
  IsArray,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TestRunStatus } from "../../entities";

export class CreateTestRunDto {
  @ApiProperty({
    description: "Name/title of the test run",
    example: "Production Deploy - E2E Tests",
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: "Status of the test run",
    enum: TestRunStatus,
    example: TestRunStatus.RUNNING,
    default: TestRunStatus.RUNNING,
    enumName: "TestRunStatus",
  })
  @IsEnum(TestRunStatus)
  @IsOptional()
  status?: TestRunStatus;

  @ApiPropertyOptional({
    description: "Total number of tests in the run",
    example: 150,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  totalTests?: number;

  @ApiPropertyOptional({
    description: "Number of passed tests",
    example: 145,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  passedTests?: number;

  @ApiPropertyOptional({
    description: "Number of failed tests",
    example: 3,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  failedTests?: number;

  @ApiPropertyOptional({
    description: "Number of skipped tests",
    example: 2,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  skippedTests?: number;

  @ApiPropertyOptional({
    description: "Duration of the test run in milliseconds",
    example: 180000,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({
    description: "Timestamp when the test run started",
    example: "2025-11-16T23:00:00.000Z",
    format: "date-time",
  })
  @IsDateString()
  @IsOptional()
  startedAt?: string;

  @ApiPropertyOptional({
    description: "Timestamp when the test run finished",
    example: "2025-11-16T23:30:00.000Z",
    format: "date-time",
  })
  @IsDateString()
  @IsOptional()
  finishedAt?: string;

  @ApiPropertyOptional({
    description: "Additional metadata for the test run (key-value pairs)",
    example: { playwright_version: "1.40.0", browser: "chromium", os: "linux" },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: "Logs output from the test run",
    example: "Test suite started...\nRunning test 1...\nAll tests completed.",
  })
  @IsString()
  @IsOptional()
  logs?: string;

  @ApiPropertyOptional({
    description: "Git branch name",
    example: "main",
  })
  @IsString()
  @IsOptional()
  branch?: string;

  @ApiPropertyOptional({
    description: "Git commit hash",
    example: "a1b2c3d4e5f6789012345678901234567890abcd",
  })
  @IsString()
  @IsOptional()
  commit?: string;

  @ApiPropertyOptional({
    description: "Environment where tests were executed",
    example: "production",
  })
  @IsString()
  @IsOptional()
  environment?: string;

  @ApiProperty({
    description: "UUID of the organization this test run belongs to",
    example: "123e4567-e89b-12d3-a456-426614174000",
    format: "uuid",
  })
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;
}

export class UpdateTestRunDto {
  @ApiPropertyOptional({
    description: "Status of the test run",
    enum: TestRunStatus,
    example: TestRunStatus.PASSED,
    enumName: "TestRunStatus",
  })
  @IsEnum(TestRunStatus)
  @IsOptional()
  status?: TestRunStatus;

  @ApiPropertyOptional({
    description: "Total number of tests in the run",
    example: 150,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  totalTests?: number;

  @ApiPropertyOptional({
    description: "Number of passed tests",
    example: 145,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  passedTests?: number;

  @ApiPropertyOptional({
    description: "Number of failed tests",
    example: 3,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  failedTests?: number;

  @ApiPropertyOptional({
    description: "Number of skipped tests",
    example: 2,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  skippedTests?: number;

  @ApiPropertyOptional({
    description: "Duration of the test run in milliseconds",
    example: 180000,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({
    description: "Timestamp when the test run finished",
    example: "2025-11-16T23:30:00.000Z",
    format: "date-time",
  })
  @IsDateString()
  @IsOptional()
  finishedAt?: string;

  @ApiPropertyOptional({
    description: "Additional metadata for the test run (key-value pairs)",
    example: { playwright_version: "1.40.0", browser: "chromium", os: "linux" },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: "Logs output from the test run",
    example: "Test suite started...\nRunning test 1...\nAll tests completed.",
  })
  @IsString()
  @IsOptional()
  logs?: string;
}

export class DeleteTestRunsDto {
  @ApiProperty({
    description: "Array of test run UUIDs to delete",
    example: [
      "123e4567-e89b-12d3-a456-426614174000",
      "987fcdeb-51a2-43b7-9876-543210fedcba",
    ],
    type: [String],
    isArray: true,
  })
  @IsArray()
  @IsUUID("4", { each: true })
  @IsNotEmpty()
  testRunIds: string[];
}
