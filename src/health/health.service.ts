import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthStatus } from './dto/health-status.type';

@Injectable()
export class HealthService {
  constructor(private readonly configService: ConfigService) {}

  getHealthStatus(): HealthStatus {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: this.configService.get<string>('NODE_ENV') || 'development',
      graphqlEndpoint: '/graphql',
    };
  }

  getSimpleStatus(): string {
    return 'GraphQL API is running';
  }
}
