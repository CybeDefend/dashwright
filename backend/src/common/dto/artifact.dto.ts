import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { ArtifactType } from '../../entities';

export class CreateArtifactDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsEnum(ArtifactType)
  @IsNotEmpty()
  type: ArtifactType;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsNumber()
  @IsNotEmpty()
  size: number;

  @IsString()
  @IsOptional()
  storageKey?: string;

  @IsString()
  @IsOptional()
  testName?: string;

  @IsUUID()
  @IsNotEmpty()
  testRunId: string;
}
