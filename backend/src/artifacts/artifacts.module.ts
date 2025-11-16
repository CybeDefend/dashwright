import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Artifact } from '../entities';
import { ArtifactsController } from './artifacts.controller';
import { ArtifactsService } from './artifacts.service';
import { StorageService } from './storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([Artifact]), ConfigModule],
  controllers: [ArtifactsController],
  providers: [ArtifactsService, StorageService],
  exports: [ArtifactsService, StorageService],
})
export class ArtifactsModule {}
