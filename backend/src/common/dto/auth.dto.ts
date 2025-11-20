import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsUUID,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({
    description: "Username for login",
    example: "john.doe",
  })
  @IsString()
  @IsNotEmpty()
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
}

export class RegisterDto {
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
    description: "User email address",
    example: "john.doe@example.com",
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "User password (minimum 8 characters)",
    example: "SecurePassword123",
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: "Full name of the user",
    example: "John Doe",
    required: false,
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({
    description: "Name of the organization to create",
    example: "Acme Corporation",
  })
  @IsString()
  @IsNotEmpty()
  organizationName: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: "JWT refresh token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: "JWT access token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  accessToken: string;

  @ApiProperty({
    description: "JWT refresh token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  refreshToken: string;

  @ApiProperty({
    description: "User information",
    example: {
      id: "123e4567-e89b-12d3-a456-426614174000",
      username: "john.doe",
      fullName: "John Doe",
      organizationId: "123e4567-e89b-12d3-a456-426614174001",
      isSuperAdmin: false,
      roles: [
        {
          id: "123e4567-e89b-12d3-a456-426614174002",
          role: "admin",
        },
      ],
    },
  })
  user: {
    id: string;
    username: string;
    fullName: string;
    organizationId: string;
    isSuperAdmin?: boolean;
    roles?: Array<{
      id: string;
      role: string;
    }>;
  };
}
