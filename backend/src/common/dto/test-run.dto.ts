import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  IsObject,
  IsDateString,
} from 'class-validator';
import { TestRunStatus } from '../../entities';

export class CreateTestRunDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(TestRunStatus)
  @IsOptional()
  status?: TestRunStatus;

  @IsNumber()
  @IsOptional()
  totalTests?: number;

  @IsNumber()
  @IsOptional()
  passedTests?: number;

  @IsNumber()
  @IsOptional()
  failedTests?: number;

  @IsNumber()
  @IsOptional()
  skippedTests?: number;

  @IsNumber()
  @IsOptional()
  duration?: number;

  @IsDateString()
  @IsOptional()
  startedAt?: Date;

  @IsDateString()
  @IsOptional()
  finishedAt?: Date;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  logs?: string;

  @IsString()
  @IsOptional()
  branch?: string;

  @IsString()
  @IsOptional()
  commit?: string;

  @IsString()
  @IsOptional()
  environment?: string;

  @IsUUID()
  @IsNotEmpty()
  organizationId: string;
}

export class UpdateTestRunDto {
  @IsEnum(TestRunStatus)
  @IsOptional()
  status?: TestRunStatus;

  @IsNumber()
  @IsOptional()
  totalTests?: number;

  @IsNumber()
  @IsOptional()
  passedTests?: number;

  @IsNumber()
  @IsOptional()
  failedTests?: number;

  @IsNumber()
  @IsOptional()
  skippedTests?: number;

  @IsNumber()
  @IsOptional()
  duration?: number;

  @IsDateString()
  @IsOptional()
  finishedAt?: Date;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  logs?: string;
}
