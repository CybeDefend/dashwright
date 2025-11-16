import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ArtifactType } from "../../entities";

export class CreateArtifactDto {
  @ApiProperty({
    description: "Name of the artifact file",
    example: "test-screenshot-homepage.png",
  })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({
    description: "Type of the artifact",
    enum: ArtifactType,
    example: ArtifactType.SCREENSHOT,
    enumName: "ArtifactType",
  })
  @IsEnum(ArtifactType)
  @IsNotEmpty()
  type: ArtifactType;

  @ApiProperty({
    description: "MIME type of the artifact",
    example: "image/png",
  })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({
    description: "Size of the artifact in bytes",
    example: 245678,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  size: number;

  @ApiPropertyOptional({
    description: "Storage key/path in MinIO/S3",
    example: "artifacts/123e4567-e89b-12d3-a456-426614174000/screenshot-1.png",
  })
  @IsString()
  @IsOptional()
  storageKey?: string;

  @ApiPropertyOptional({
    description: "Name of the test that generated this artifact",
    example: "should load homepage successfully",
  })
  @IsString()
  @IsOptional()
  testName?: string;

  @ApiProperty({
    description: "UUID of the test run this artifact belongs to",
    example: "123e4567-e89b-12d3-a456-426614174000",
    format: "uuid",
  })
  @IsUUID()
  @IsNotEmpty()
  testRunId: string;
}
