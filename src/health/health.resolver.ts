import { Query, Resolver } from '@nestjs/graphql';
import { HealthService } from './health.service';
import { HealthStatus } from './dto/health-status.type';

@Resolver()
export class HealthResolver {
  constructor(private readonly healthService: HealthService) {}

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  @Query(() => HealthStatus)
  health(): HealthStatus {
    return this.healthService.getHealthStatus();
  }

  @Query(() => String)
  status(): string {
    return this.healthService.getSimpleStatus();
  }
}
