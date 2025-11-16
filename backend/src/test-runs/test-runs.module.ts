import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestRun } from '../entities';
import { TestRunsController } from './test-runs.controller';
import { TestRunsService } from './test-runs.service';
import { TestRunsGateway } from './test-runs.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([TestRun])],
  controllers: [TestRunsController],
  providers: [TestRunsService, TestRunsGateway],
  exports: [TestRunsService, TestRunsGateway],
})
export class TestRunsModule {}
