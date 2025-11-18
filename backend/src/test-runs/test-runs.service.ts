import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { TestRun, Test, Artifact } from "../entities";
import { CreateTestRunDto, UpdateTestRunDto } from "../common/dto/test-run.dto";
import { StorageService } from "../artifacts/storage.service";

@Injectable()
export class TestRunsService {
  constructor(
    @InjectRepository(TestRun)
    private testRunRepository: Repository<TestRun>,
    @InjectRepository(Test)
    private testRepository: Repository<Test>,
    @InjectRepository(Artifact)
    private artifactRepository: Repository<Artifact>,
    private storageService: StorageService,
  ) {}

  async create(
    createTestRunDto: CreateTestRunDto,
    createdById?: string,
  ): Promise<TestRun> {
    const testRun = this.testRunRepository.create({
      ...createTestRunDto,
      createdById,
      startedAt: createTestRunDto.startedAt
        ? new Date(createTestRunDto.startedAt)
        : new Date(),
      finishedAt: createTestRunDto.finishedAt
        ? new Date(createTestRunDto.finishedAt)
        : undefined,
    });

    return this.testRunRepository.save(testRun);
  }

  async findAll(organizationId?: string): Promise<TestRun[]> {
    const where = organizationId ? { organizationId } : {};

    return this.testRunRepository.find({
      where,
      relations: ["artifacts", "createdBy", "organization"],
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string): Promise<TestRun | null> {
    return this.testRunRepository.findOne({
      where: { id },
      relations: ["artifacts", "tests", "createdBy", "organization"],
    });
  }

  async update(
    id: string,
    updateTestRunDto: UpdateTestRunDto,
  ): Promise<TestRun | null> {
    const updateData = {
      ...updateTestRunDto,
      finishedAt: updateTestRunDto.finishedAt
        ? new Date(updateTestRunDto.finishedAt)
        : undefined,
    };

    await this.testRunRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.testRunRepository.delete(id);
  }

  async updateProgress(
    id: string,
    passedTests: number,
    failedTests: number,
    skippedTests: number,
  ): Promise<TestRun | null> {
    await this.testRunRepository.update(id, {
      passedTests,
      failedTests,
      skippedTests,
    });
    return this.findOne(id);
  }

  async removeTestsWithArtifacts(
    testRunId: string,
    testIds: string[],
  ): Promise<void> {
    // Find all tests to delete
    const tests = await this.testRepository.find({
      where: {
        id: In(testIds),
        testRunId,
      },
    });

    if (tests.length === 0) {
      return;
    }

    // Find all artifacts associated with these tests
    const testNames = tests.map((test) => test.name);
    const artifacts = await this.artifactRepository.find({
      where: {
        testRunId,
        testName: In(testNames),
      },
    });

    // Delete artifacts from S3 storage
    for (const artifact of artifacts) {
      try {
        await this.storageService.deleteFile(artifact.storageKey);
      } catch (error) {
        console.error(
          `Failed to delete artifact ${artifact.id} from S3:`,
          error,
        );
        // Continue with deletion even if S3 deletion fails
      }
    }

    // Delete artifacts from database (will cascade due to foreign key)
    if (artifacts.length > 0) {
      await this.artifactRepository.delete(artifacts.map((a) => a.id));
    }

    // Delete tests from database
    await this.testRepository.delete(testIds);
  }

  async removeMultipleWithArtifacts(testRunIds: string[]): Promise<void> {
    if (testRunIds.length === 0) {
      return;
    }

    // Find all artifacts associated with these test runs
    const artifacts = await this.artifactRepository.find({
      where: {
        testRunId: In(testRunIds),
      },
    });

    // Delete artifacts from S3 storage
    for (const artifact of artifacts) {
      try {
        await this.storageService.deleteFile(artifact.storageKey);
      } catch (error) {
        console.error(
          `Failed to delete artifact ${artifact.id} from S3:`,
          error,
        );
        // Continue with deletion even if S3 deletion fails
      }
    }

    // Delete artifacts from database
    if (artifacts.length > 0) {
      await this.artifactRepository.delete(artifacts.map((a) => a.id));
    }

    // Delete tests from database (will cascade)
    await this.testRepository.delete({
      testRunId: In(testRunIds),
    });

    // Delete test runs from database
    await this.testRunRepository.delete(testRunIds);
  }
}
