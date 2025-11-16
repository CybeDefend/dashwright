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
import { ApiKeysService } from "./api-keys.service";
import { CreateApiKeyDto, ApiKeyResponseDto } from "../common/dto/api-key.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../guards/roles.guard";
import { Roles } from "../decorators/roles.decorator";
import { RoleType } from "../entities/user-role.entity";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { User } from "../entities";

@ApiTags("API Keys")
@ApiBearerAuth("JWT-auth")
@Controller("api-keys")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Post()
  @Roles(RoleType.ADMIN, RoleType.MAINTAINER)
  @ApiOperation({ summary: "Create a new API key" })
  @ApiResponse({
    status: 201,
    description: "API key successfully created. The key is only shown once!",
    type: ApiKeyResponseDto,
  })
  async create(
    @Body() createApiKeyDto: CreateApiKeyDto,
    @CurrentUser() user: User,
  ) {
    const apiKey = await this.apiKeysService.create(
      createApiKeyDto,
      user.id,
      user.organizationId,
    );

    // Return the full key only on creation
    return {
      id: apiKey.id,
      key: apiKey.key, // This will be shown only once
      name: apiKey.name,
      description: apiKey.description,
      isActive: apiKey.isActive,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt,
    };
  }

  @Get()
  @ApiOperation({ summary: "Get all API keys for the current organization" })
  @ApiResponse({
    status: 200,
    description: "List of API keys retrieved successfully",
    type: [ApiKeyResponseDto],
  })
  findAll(@CurrentUser() user: User) {
    return this.apiKeysService.findAll(user.id, user.organizationId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an API key by ID" })
  @ApiParam({ name: "id", description: "API Key UUID" })
  @ApiResponse({
    status: 200,
    description: "API key retrieved successfully",
    type: ApiKeyResponseDto,
  })
  @ApiResponse({ status: 404, description: "API key not found" })
  findOne(@Param("id") id: string, @CurrentUser() user: User) {
    return this.apiKeysService.findOne(id, user.organizationId);
  }

  @Patch(":id/revoke")
  @Roles(RoleType.ADMIN, RoleType.MAINTAINER)
  @ApiOperation({ summary: "Revoke an API key (mark as inactive)" })
  @ApiParam({ name: "id", description: "API Key UUID" })
  @ApiResponse({ status: 200, description: "API key successfully revoked" })
  @ApiResponse({ status: 404, description: "API key not found" })
  async revoke(@Param("id") id: string, @CurrentUser() user: User) {
    await this.apiKeysService.revoke(id, user.organizationId);
    return { message: "API key revoked successfully" };
  }

  @Delete(":id")
  @Roles(RoleType.ADMIN, RoleType.MAINTAINER)
  @ApiOperation({ summary: "Delete an API key permanently" })
  @ApiParam({ name: "id", description: "API Key UUID" })
  @ApiResponse({ status: 200, description: "API key successfully deleted" })
  @ApiResponse({ status: 404, description: "API key not found" })
  async remove(@Param("id") id: string, @CurrentUser() user: User) {
    await this.apiKeysService.remove(id, user.organizationId);
    return { message: "API key deleted successfully" };
  }
}
