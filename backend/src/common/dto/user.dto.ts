import { 
  IsString, 
  IsNotEmpty, 
  MinLength, 
  IsOptional, 
  IsUUID, 
  IsBoolean,
  IsEnum 
} from 'class-validator';
import { RoleType } from '../../entities';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsUUID()
  @IsNotEmpty()
  organizationId: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  username?: string;

  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class AssignRoleDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(RoleType)
  @IsNotEmpty()
  role: RoleType;

  @IsString()
  @IsOptional()
  scope?: string;
}
