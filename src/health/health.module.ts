import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthResolver } from './health.resolver';
import { HealthService } from './health.service';

@Module({
  imports: [ConfigModule],
  providers: [HealthResolver, HealthService],
})
export class HealthModule {}
