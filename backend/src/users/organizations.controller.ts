import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from '../common/dto/organization.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleType } from '../entities';

@ApiTags('Organizations')
@ApiBearerAuth('JWT-auth')
@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  @Post()
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Create a new organization (Admin only)' })
  @ApiResponse({ status: 201, description: 'Organization successfully created' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Get()
  @Roles(RoleType.ADMIN, RoleType.MAINTAINER)
  @ApiOperation({ summary: 'Get all organizations (Admin/Maintainer only)' })
  @ApiResponse({ status: 200, description: 'List of organizations retrieved successfully' })
  findAll() {
    return this.organizationsService.findAll();
  }

  @Get(':id')
  @Roles(RoleType.ADMIN, RoleType.MAINTAINER)
  @ApiOperation({ summary: 'Get an organization by ID (Admin/Maintainer only)' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiResponse({ status: 200, description: 'Organization retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  findOne(@Param('id') id: string) {
    return this.organizationsService.findOne(id);
  }

  @Put(':id')
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Update an organization (Admin only)' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiResponse({ status: 200, description: 'Organization successfully updated' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  update(@Param('id') id: string, @Body() updateOrganizationDto: UpdateOrganizationDto) {
    return this.organizationsService.update(id, updateOrganizationDto);
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Delete an organization (Admin only)' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiResponse({ status: 200, description: 'Organization successfully deleted' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  remove(@Param('id') id: string) {
    return this.organizationsService.remove(id);
  }
}
