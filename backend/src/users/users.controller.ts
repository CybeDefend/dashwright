import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, AssignRoleDto } from '../common/dto/user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleType } from '../entities';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  getProfile(@Request() req: any) {
    return this.usersService.findOne(req.user.userId);
  }

  @Post()
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(RoleType.ADMIN, RoleType.MAINTAINER)
  @ApiOperation({ summary: 'Get all users (Admin/Maintainer only)' })
  @ApiResponse({ status: 200, description: 'List of users retrieved successfully' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(RoleType.ADMIN, RoleType.MAINTAINER)
  @ApiOperation({ summary: 'Get a user by ID (Admin/Maintainer only)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Update a user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User successfully updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Delete a user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User successfully deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post('assign-role')
  @Roles(RoleType.ADMIN)
  @ApiOperation({ summary: 'Assign a role to a user (Admin only)' })
  @ApiResponse({ status: 200, description: 'Role successfully assigned' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  assignRole(@Body() assignRoleDto: AssignRoleDto) {
    return this.usersService.assignRole(
      assignRoleDto.userId,
      assignRoleDto.role,
      assignRoleDto.scope,
    );
  }
}
