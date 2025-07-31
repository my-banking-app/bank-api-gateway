import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'NODE_ENV':
          return 'test';
        default:
          return undefined;
      }
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHealthStatus', () => {
    it('should return health status with correct structure', () => {
      const result = service.getHealthStatus();

      expect(result).toHaveProperty('status', 'OK');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('environment', 'test');
      expect(result).toHaveProperty('graphqlEndpoint', '/graphql');
      expect(typeof result.timestamp).toBe('string');
      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should use default environment when NODE_ENV is not set', () => {
      mockConfigService.get.mockReturnValue(undefined);

      const result = service.getHealthStatus();

      expect(result.environment).toBe('development');
    });

    it('should use default version when npm_package_version is not set', () => {
      const originalVersion = process.env.npm_package_version;
      delete process.env.npm_package_version;

      const result = service.getHealthStatus();

      expect(result.version).toBe('1.0.0');

      // Restore original value
      if (originalVersion) {
        process.env.npm_package_version = originalVersion;
      }
    });

    it('should return valid ISO timestamp', () => {
      const result = service.getHealthStatus();
      const timestamp = new Date(result.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });

  describe('getSimpleStatus', () => {
    it('should return simple status message', () => {
      const result = service.getSimpleStatus();

      expect(result).toBe('GraphQL API is running');
      expect(typeof result).toBe('string');
    });
  });
});
