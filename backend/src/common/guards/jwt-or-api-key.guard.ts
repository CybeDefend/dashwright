import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ApiKey } from '../../entities/api-key.entity';
import { User } from '../../entities/user.entity';

/**
 * Combined guard that allows authentication via either JWT or API Key
 * Tries JWT first, then falls back to API Key if JWT is not present
 */
@Injectable()
export class JwtOrApiKeyGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Check if Authorization header exists (JWT)
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = await this.jwtService.verifyAsync(token, {
          secret: process.env.JWT_SECRET || 'your-secret-key',
        });
        
        const user = await this.userRepository.findOne({
          where: { id: payload.sub },
          relations: ['organization'],
        });

        if (!user || !user.isActive) {
          throw new UnauthorizedException('Invalid or inactive user');
        }

        request.user = user;
        return true;
      } catch (error) {
        // JWT validation failed, continue to try API key
      }
    }

    // Check if X-API-Key header exists
    const apiKeyHeader = request.headers['x-api-key'];
    if (apiKeyHeader) {
      const keyRecord = await this.apiKeyRepository.findOne({
        where: { key: apiKeyHeader, isActive: true },
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

      // Attach user to request
      request.user = keyRecord.user;
      request.apiKey = keyRecord;
      return true;
    }

    // Neither JWT nor API key provided
    throw new UnauthorizedException('Authentication required. Provide either JWT Bearer token or X-API-Key header');
  }
}
