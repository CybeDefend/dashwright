import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Patch,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { InvitationsService } from "./invitations.service";
import {
  CreateInvitationDto,
  AcceptInvitationDto,
  InvitationResponseDto,
} from "../common/dto/invitation.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { User } from "../entities";

@ApiTags("Invitations")
@Controller("invitations")
export class InvitationsController {
  constructor(private invitationsService: InvitationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Create a new invitation to join the organization" })
  @ApiResponse({
    status: 201,
    description: "Invitation created successfully",
    type: InvitationResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: "User already exists or invitation pending",
  })
  async create(
    @Body() createInvitationDto: CreateInvitationDto,
    @CurrentUser() user: User,
  ) {
    const invitation = await this.invitationsService.create(
      createInvitationDto,
      user.id,
      user.organizationId,
    );

    // Generate invitation URL (adjust based on your frontend URL)
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const invitationUrl = `${frontendUrl}/invite/accept/${invitation.token}`;

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      invitationUrl,
      createdAt: invitation.createdAt,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Get all invitations for the organization" })
  @ApiResponse({
    status: 200,
    description: "List of invitations",
    type: [InvitationResponseDto],
  })
  async findAll(@CurrentUser() user: User) {
    const invitations = await this.invitationsService.findAll(
      user.organizationId,
    );

    return invitations.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      invitedBy: invitation.invitedBy
        ? {
            id: invitation.invitedBy.id,
            username: invitation.invitedBy.username,
            fullName: invitation.invitedBy.fullName,
          }
        : null,
    }));
  }

  @Get("verify/:token")
  @ApiOperation({ summary: "Verify an invitation token" })
  @ApiParam({ name: "token", description: "Invitation token" })
  @ApiResponse({ status: 200, description: "Invitation is valid" })
  @ApiResponse({ status: 400, description: "Invitation expired or invalid" })
  async verify(@Param("token") token: string) {
    const invitation = await this.invitationsService.findByToken(token);

    return {
      email: invitation.email,
      role: invitation.role,
      organizationName: invitation.organization.name,
      expiresAt: invitation.expiresAt,
    };
  }

  @Post("accept")
  @ApiOperation({ summary: "Accept an invitation and create account" })
  @ApiResponse({ status: 201, description: "Account created successfully" })
  @ApiResponse({ status: 400, description: "Invalid or expired invitation" })
  @ApiResponse({ status: 409, description: "Username or email already taken" })
  async accept(@Body() acceptInvitationDto: AcceptInvitationDto) {
    const user = await this.invitationsService.accept(acceptInvitationDto);

    return {
      message: "Account created successfully",
      userId: user.id,
      username: user.username,
    };
  }

  @Patch(":id/revoke")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Revoke a pending invitation" })
  @ApiParam({ name: "id", description: "Invitation UUID" })
  @ApiResponse({ status: 200, description: "Invitation revoked" })
  @ApiResponse({ status: 404, description: "Invitation not found" })
  async revoke(@Param("id") id: string, @CurrentUser() user: User) {
    await this.invitationsService.revoke(id, user.organizationId);
    return { message: "Invitation revoked successfully" };
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({ summary: "Delete an invitation" })
  @ApiParam({ name: "id", description: "Invitation UUID" })
  @ApiResponse({ status: 200, description: "Invitation deleted" })
  @ApiResponse({ status: 404, description: "Invitation not found" })
  async remove(@Param("id") id: string, @CurrentUser() user: User) {
    await this.invitationsService.remove(id, user.organizationId);
    return { message: "Invitation deleted successfully" };
  }
}
