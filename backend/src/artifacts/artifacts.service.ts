import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artifact } from '../entities';
import { CreateArtifactDto } from '../common/dto/artifact.dto';

@Injectable()
export class ArtifactsService {
  constructor(
    @InjectRepository(Artifact)
    private artifactRepository: Repository<Artifact>,
  ) {}

  async create(createArtifactDto: CreateArtifactDto): Promise<Artifact> {
    const artifact = this.artifactRepository.create(createArtifactDto);
    return this.artifactRepository.save(artifact);
  }

  async findByTestRun(testRunId: string): Promise<Artifact[]> {
    return this.artifactRepository.find({
      where: { testRunId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Artifact | null> {
    return this.artifactRepository.findOne({
      where: { id },
      relations: ['testRun'],
    });
  }

  async remove(id: string): Promise<void> {
    await this.artifactRepository.delete(id);
  }
}
