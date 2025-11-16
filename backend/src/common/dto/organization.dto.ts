import { IsString, IsNotEmpty, IsOptional, IsBoolean } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateOrganizationDto {
  @ApiProperty({
    description: "Name of the organization",
    example: "Acme Corporation",
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: "Description of the organization",
    example: "A leading software development company",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: "Whether the organization is active",
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional({
    description: "Name of the organization",
    example: "Acme Corporation",
    minLength: 1,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: "Description of the organization",
    example: "A leading software development company",
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: "Whether the organization is active",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
