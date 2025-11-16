import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestRun } from '../entities';
import { CreateTestRunDto, UpdateTestRunDto } from '../common/dto/test-run.dto';

@Injectable()
export class TestRunsService {
  constructor(
    @InjectRepository(TestRun)
    private testRunRepository: Repository<TestRun>,
  ) {}

  async create(createTestRunDto: CreateTestRunDto, createdById?: string): Promise<TestRun> {
    const testRun = this.testRunRepository.create({
      ...createTestRunDto,
      createdById,
      startedAt: createTestRunDto.startedAt || new Date(),
    });

    return this.testRunRepository.save(testRun);
  }

  async findAll(organizationId?: string): Promise<TestRun[]> {
    const where = organizationId ? { organizationId } : {};
    
    return this.testRunRepository.find({
      where,
      relations: ['artifacts', 'createdBy', 'organization'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<TestRun | null> {
    return this.testRunRepository.findOne({
      where: { id },
      relations: ['artifacts', 'createdBy', 'organization'],
    });
  }

  async update(id: string, updateTestRunDto: UpdateTestRunDto): Promise<TestRun | null> {
    await this.testRunRepository.update(id, updateTestRunDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.testRunRepository.delete(id);
  }
}
