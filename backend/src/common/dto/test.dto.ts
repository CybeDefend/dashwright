import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  IsInt,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TestStatus } from "../../entities";

export class CreateTestDto {
  @ApiProperty({
    description: "Name of the test",
    example: "should display homepage correctly",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "Status of the test",
    enum: TestStatus,
    example: TestStatus.PASSED,
    enumName: "TestStatus",
  })
  @IsEnum(TestStatus)
  @IsNotEmpty()
  status: TestStatus;

  @ApiPropertyOptional({
    description: "Duration of the test in milliseconds",
    example: 1500,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({
    description: "Error message if the test failed",
    example: "Expected element to be visible",
  })
  @IsString()
  @IsOptional()
  errorMessage?: string;

  @ApiPropertyOptional({
    description: "Error stack trace if the test failed",
    example: "Error: Expected element to be visible\n    at Test.expect...",
  })
  @IsString()
  @IsOptional()
  errorStack?: string;

  @ApiPropertyOptional({
    description: "Number of times the test was retried",
    example: 2,
    minimum: 0,
  })
  @IsInt()
  @IsOptional()
  retries?: number;

  @ApiProperty({
    description: "UUID of the test run this test belongs to",
    example: "123e4567-e89b-12d3-a456-426614174000",
    format: "uuid",
  })
  @IsUUID()
  @IsNotEmpty()
  testRunId: string;
}
