import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Organization, Team, UserRole } from '../entities';
import { UsersController } from './users.controller';
import { OrganizationsController } from './organizations.controller';
import { TeamsController } from './teams.controller';
import { UsersService } from './users.service';
import { OrganizationsService } from './organizations.service';
import { TeamsService } from './teams.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Organization, Team, UserRole])],
  controllers: [UsersController, OrganizationsController, TeamsController],
  providers: [UsersService, OrganizationsService, TeamsService],
  exports: [UsersService, OrganizationsService, TeamsService],
})
export class UsersModule {}
