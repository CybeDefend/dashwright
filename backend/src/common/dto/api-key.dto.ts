import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ 
    description: 'Name for the API key',
    example: 'CI/CD Pipeline Key'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: 'Description of the API key usage',
    example: 'Used for automated test uploads from GitHub Actions',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    description: 'Expiration date for the API key (optional)',
    example: '2026-12-31T23:59:59Z',
    required: false
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

export class ApiKeyResponseDto {
  @ApiProperty({ description: 'API Key ID' })
  id: string;

  @ApiProperty({ description: 'API Key (only shown once on creation)' })
  key?: string;

  @ApiProperty({ description: 'Key name' })
  name: string;

  @ApiProperty({ description: 'Key description' })
  description?: string;

  @ApiProperty({ description: 'Whether the key is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Last time the key was used' })
  lastUsedAt?: Date;

  @ApiProperty({ description: 'Key expiration date' })
  expiresAt?: Date;

  @ApiProperty({ description: 'Key creation date' })
  createdAt: Date;
}
