import { Query, Resolver } from '@nestjs/graphql';
import { HealthService } from './health.service';
import { HealthStatus } from './dto/health-status.type';

@Resolver()
export class HealthResolver {
  constructor(private readonly healthService: HealthService) {}

  @Query(() => HealthStatus)
  health(): HealthStatus {
    return this.healthService.getHealthStatus();
  }

  @Query(() => String)
  status(): string {
    return this.healthService.getSimpleStatus();
  }
}
