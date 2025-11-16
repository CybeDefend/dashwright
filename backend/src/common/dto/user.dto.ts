import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsEnum,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RoleType } from "../../entities";

export class CreateUserDto {
  @ApiProperty({
    description: "Unique username (minimum 3 characters)",
    example: "john.doe",
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @ApiProperty({
    description: "User password (minimum 8 characters)",
    example: "SecurePassword123",
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    description: "Full name of the user",
    example: "John Doe",
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({
    description: "Organization UUID that the user belongs to",
    example: "123e4567-e89b-12d3-a456-426614174000",
    format: "uuid",
  })
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;

  @ApiPropertyOptional({
    description: "Whether the user account is active",
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: "Unique username (minimum 3 characters)",
    example: "john.doe",
    minLength: 3,
  })
  @IsString()
  @IsOptional()
  @MinLength(3)
  username?: string;

  @ApiPropertyOptional({
    description: "User password (minimum 8 characters)",
    example: "NewSecurePassword123",
    minLength: 8,
  })
  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({
    description: "Full name of the user",
    example: "John Doe",
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({
    description: "Whether the user account is active",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class AssignRoleDto {
  @ApiProperty({
    description: "UUID of the user to assign the role to",
    example: "123e4567-e89b-12d3-a456-426614174000",
    format: "uuid",
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: "Role type to assign",
    enum: RoleType,
    example: RoleType.VIEWER,
    enumName: "RoleType",
  })
  @IsEnum(RoleType)
  @IsNotEmpty()
  role: RoleType;

  @ApiPropertyOptional({
    description: "Scope of the role (optional, for team-specific roles)",
    example: "team:123e4567-e89b-12d3-a456-426614174001",
  })
  @IsString()
  @IsOptional()
  scope?: string;
}
