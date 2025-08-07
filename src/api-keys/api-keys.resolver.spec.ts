import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeysResolver } from './api-keys.resolver';
import { ApiKeysService } from './api-keys.service';
import { GenerateApiKeyInput } from './dto/generate-api-key.input';
import { ApiKeyResponse } from './dto/api-key-response.type';

describe('ApiKeysResolver', () => {
  let resolver: ApiKeysResolver;
  let service: ApiKeysService;

  const mockApiKeysService = {
    generateApiKey: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysResolver,
        {
          provide: ApiKeysService,
          useValue: mockApiKeysService,
        },
      ],
    }).compile();

    resolver = module.get<ApiKeysResolver>(ApiKeysResolver);
    service = module.get<ApiKeysService>(ApiKeysService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('generateApiKey', () => {
    it('should generate an API key successfully', () => {
      // Arrange
      const input: GenerateApiKeyInput = {
        duration: '1h',
        description: 'Test API key',
      };

      const expectedResponse: ApiKeyResponse = {
        apiKey: 'test-api-key-123',
        expiresAt: '2024-01-01T01:00:00.000Z',
        expiresIn: 3600000,
        message: 'API key generated successfully',
      };

      mockApiKeysService.generateApiKey.mockReturnValue(expectedResponse);

      // Act
      const result = resolver.generateApiKey(input);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(service.generateApiKey).toHaveBeenCalledWith(input);
      expect(service.generateApiKey).toHaveBeenCalledTimes(1);
    });

    it('should generate an API key without description', () => {
      // Arrange
      const input: GenerateApiKeyInput = {
        duration: '24h',
      };

      const expectedResponse: ApiKeyResponse = {
        apiKey: 'test-api-key-456',
        expiresAt: '2024-01-02T00:00:00.000Z',
        expiresIn: 86400000,
        message: 'API key generated successfully',
      };

      mockApiKeysService.generateApiKey.mockReturnValue(expectedResponse);

      // Act
      const result = resolver.generateApiKey(input);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(service.generateApiKey).toHaveBeenCalledWith(input);
      expect(service.generateApiKey).toHaveBeenCalledTimes(1);
    });

    it('should handle different duration values', () => {
      // Arrange
      const durations = ['1h', '24h', '7d', '30d'];
      
      durations.forEach((duration, index) => {
        const input: GenerateApiKeyInput = {
          duration,
          description: `Test for ${duration}`,
        };

        const expectedResponse: ApiKeyResponse = {
          apiKey: `test-api-key-${index}`,
          expiresAt: '2024-01-01T00:00:00.000Z',
          expiresIn: 3600000,
          message: 'API key generated successfully',
        };

        mockApiKeysService.generateApiKey.mockReturnValue(expectedResponse);

        // Act
        const result = resolver.generateApiKey(input);

        // Assert
        expect(result).toEqual(expectedResponse);
        expect(service.generateApiKey).toHaveBeenCalledWith(input);
      });

      expect(service.generateApiKey).toHaveBeenCalledTimes(durations.length);
    });
  });
});