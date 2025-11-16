import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID, IsArray } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsNotEmpty()
  organizationId: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  memberIds?: string[];
}

export class UpdateTeamDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  memberIds?: string[];
}
