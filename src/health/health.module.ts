import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthResolver } from './health.resolver';
import { HealthService } from './health.service';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [ConfigModule, ApiKeysModule],
  providers: [HealthResolver, HealthService],
})
export class HealthModule {}
