import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../../entities/api-key.entity';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = this.extractApiKeyFromHeader(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is missing');
    }

    const keyRecord = await this.apiKeyRepository.findOne({
      where: { key: apiKey, isActive: true },
      relations: ['user', 'organization'],
    });

    if (!keyRecord) {
      throw new UnauthorizedException('Invalid or inactive API key');
    }

    // Check if the key has expired
    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    // Update last used timestamp (fire and forget)
    this.apiKeyRepository
      .update(keyRecord.id, { lastUsedAt: new Date() })
      .catch(() => {}); // Ignore errors in background update

    // Attach user and organization to request
    request.user = keyRecord.user;
    request.apiKey = keyRecord;

    return true;
  }

  private extractApiKeyFromHeader(request: any): string | undefined {
    const apiKey = request.headers['x-api-key'];
    return apiKey;
  }
}
