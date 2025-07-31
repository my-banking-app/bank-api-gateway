import { Test, TestingModule } from '@nestjs/testing';
import { HealthResolver } from './health.resolver';
import { HealthService } from './health.service';
import { HealthStatus } from './dto/health-status.type';

describe('HealthResolver', () => {
  let resolver: HealthResolver;

  const mockHealthService = {
    getHealthStatus: jest.fn(),
    getSimpleStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthResolver,
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    resolver = module.get<HealthResolver>(HealthResolver);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('health', () => {
    it('should return health status', () => {
      const mockHealthStatus: HealthStatus = {
        status: 'OK',
        timestamp: '2023-01-01T00:00:00.000Z',
        uptime: 3600,
        version: '1.0.0',
        environment: 'test',
        graphqlEndpoint: '/graphql',
      };

      mockHealthService.getHealthStatus.mockReturnValue(mockHealthStatus);

      const result = resolver.health() as HealthStatus;

      expect(result).toEqual(mockHealthStatus);
      expect(mockHealthService.getHealthStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('status', () => {
    it('should return simple status string', () => {
      const mockStatus = 'GraphQL API is running';
      mockHealthService.getSimpleStatus.mockReturnValue(mockStatus);

      const result = resolver.status();

      expect(result).toBe(mockStatus);
      expect(mockHealthService.getSimpleStatus).toHaveBeenCalledTimes(1);
    });
  });
});
