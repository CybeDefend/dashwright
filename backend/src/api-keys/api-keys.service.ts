import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ApiKey } from '../entities/api-key.entity';
import { CreateApiKeyDto } from '../common/dto/api-key.dto';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  async create(createApiKeyDto: CreateApiKeyDto, userId: string, organizationId: string): Promise<ApiKey> {
    const apiKey = this.apiKeyRepository.create({
      name: createApiKeyDto.name,
      description: createApiKeyDto.description,
      userId,
      organizationId,
      expiresAt: createApiKeyDto.expiresAt ? new Date(createApiKeyDto.expiresAt) : undefined,
    });

    return await this.apiKeyRepository.save(apiKey);
  }

  async findAll(userId: string, organizationId: string): Promise<ApiKey[]> {
    return this.apiKeyRepository.find({
      where: { organizationId },
      select: ['id', 'name', 'description', 'isActive', 'lastUsedAt', 'expiresAt', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, organizationId: string): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id, organizationId },
      select: ['id', 'name', 'description', 'isActive', 'lastUsedAt', 'expiresAt', 'createdAt'],
    });

    if (!apiKey) {
      throw new NotFoundException('API Key not found');
    }

    return apiKey;
  }

  async validateApiKey(key: string): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { key, isActive: true },
      relations: ['user', 'organization'],
    });

    if (!apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check if key has expired
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    // Update last used timestamp
    await this.apiKeyRepository.update(apiKey.id, { lastUsedAt: new Date() });

    return apiKey;
  }

  async revoke(id: string, organizationId: string): Promise<void> {
    const apiKey = await this.findOne(id, organizationId);
    await this.apiKeyRepository.update(id, { isActive: false });
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const apiKey = await this.findOne(id, organizationId);
    await this.apiKeyRepository.remove(apiKey);
  }

  async cleanupExpiredKeys(): Promise<void> {
    await this.apiKeyRepository.update(
      { expiresAt: LessThan(new Date()), isActive: true },
      { isActive: false }
    );
  }
}
