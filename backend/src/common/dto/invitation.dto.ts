import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { RoleType } from "../../entities";

export class CreateInvitationDto {
  @ApiProperty({
    description: "Email address of the user to invite",
    example: "john.doe@example.com",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "Role to assign to the invited user",
    enum: RoleType,
    example: RoleType.VIEWER,
  })
  @IsEnum(RoleType)
  role: RoleType;
}

export class AcceptInvitationDto {
  @ApiProperty({
    description: "Invitation token received via email",
    example: "a1b2c3d4e5f6...",
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: "Username for the new account",
    example: "johndoe",
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: "Password for the new account",
    example: "SecurePass123!",
  })
  @IsString()
  password: string;

  @ApiProperty({
    description: "Full name of the user",
    example: "John Doe",
  })
  @IsString()
  fullName: string;
}

export class InvitationResponseDto {
  @ApiProperty({ description: "Invitation ID" })
  id: string;

  @ApiProperty({ description: "Email address" })
  email: string;

  @ApiProperty({ description: "Role", enum: RoleType })
  role: RoleType;

  @ApiProperty({
    description: "Status",
    enum: ["pending", "accepted", "expired", "revoked"],
  })
  status: string;

  @ApiProperty({ description: "Expiration date" })
  expiresAt: Date;

  @ApiProperty({ description: "Invitation URL (only shown once at creation)" })
  invitationUrl?: string;

  @ApiProperty({ description: "Created at" })
  createdAt: Date;
}
