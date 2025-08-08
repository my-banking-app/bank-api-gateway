import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ApiKeysService } from './api-keys.service';
import { GenerateApiKeyInput } from './dto/generate-api-key.input';
import {
  ApiKeyResponse,
  ValidateApiKeyResponse,
} from './dto/api-key-response.type';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ApiKeysService>(ApiKeysService);
    configService = module.get<ConfigService>(ConfigService);

    // Setup default mock return value
    mockConfigService.get.mockReturnValue('bgw');
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clear any timers that might be running
    jest.clearAllTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateApiKey', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should generate an API key with 1h duration', () => {
      // Arrange
      const input: GenerateApiKeyInput = {
        duration: '1h',
        description: 'Test API key',
      };

      // Act
      const result: ApiKeyResponse = service.generateApiKey(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.apiKey).toMatch(/^bgw_[a-f0-9]{64}$/);
      expect(result.expiresAt).toBe('2024-01-01T01:00:00.000Z');
      expect(result.expiresIn).toBe(3600);
      expect(result.message).toBe('API Key generada exitosamente');
      expect(configService.get).toHaveBeenCalledWith('API_KEY_PREFIX');
    });

    it('should generate an API key with 24h duration', () => {
      // Arrange
      const input: GenerateApiKeyInput = {
        duration: '24h',
      };

      // Act
      const result: ApiKeyResponse = service.generateApiKey(input);

      // Assert
      expect(result.expiresAt).toBe('2024-01-02T00:00:00.000Z');
      expect(result.expiresIn).toBe(86400);
    });

    it('should generate an API key with 7d duration', () => {
      // Arrange
      const input: GenerateApiKeyInput = {
        duration: '7d',
      };

      // Act
      const result: ApiKeyResponse = service.generateApiKey(input);

      // Assert
      expect(result.expiresAt).toBe('2024-01-08T00:00:00.000Z');
      expect(result.expiresIn).toBe(604800);
    });

    it('should generate an API key with 30d duration', () => {
      // Arrange
      const input: GenerateApiKeyInput = {
        duration: '30d',
      };

      // Act
      const result: ApiKeyResponse = service.generateApiKey(input);

      // Assert
      expect(result.expiresAt).toBe('2024-01-31T00:00:00.000Z');
      expect(result.expiresIn).toBe(2592000);
    });

    it('should throw error for invalid duration', () => {
      // Arrange
      const input: GenerateApiKeyInput = {
        duration: 'invalid',
      };

      // Act & Assert
      expect(() => service.generateApiKey(input)).toThrow(
        'Duración no válida: invalid',
      );
    });

    it('should use default prefix when config is not set', () => {
      // Arrange
      mockConfigService.get.mockReturnValue(undefined);
      const input: GenerateApiKeyInput = {
        duration: '1h',
      };

      // Act
      const result: ApiKeyResponse = service.generateApiKey(input);

      // Assert
      expect(result.apiKey).toMatch(/^bgw_[a-f0-9]{64}$/);
    });

    it('should use custom prefix from config', () => {
      // Arrange
      mockConfigService.get.mockReturnValue('custom');
      const input: GenerateApiKeyInput = {
        duration: '1h',
      };

      // Act
      const result: ApiKeyResponse = service.generateApiKey(input);

      // Assert
      expect(result.apiKey).toMatch(/^custom_[a-f0-9]{64}$/);
    });
  });

  describe('validateApiKey', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should validate a valid API key', () => {
      // Arrange
      const input: GenerateApiKeyInput = {
        duration: '1h',
        description: 'Test API key',
      };
      const generated = service.generateApiKey(input);

      // Act
      const result: ValidateApiKeyResponse = service.validateApiKey(
        generated.apiKey,
      );

      // Assert
      expect(result.valid).toBe(true);
      expect(result.expiresAt).toBe('2024-01-01T01:00:00.000Z');
      expect(result.remainingTime).toBe(3600);
    });

    it('should return false for non-existent API key', () => {
      // Arrange
      const fakeApiKey = 'bgw_nonexistent';

      // Act
      const result: ValidateApiKeyResponse = service.validateApiKey(fakeApiKey);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.expiresAt).toBeUndefined();
      expect(result.remainingTime).toBeUndefined();
    });

    it('should return false for expired API key', () => {
      // Arrange
      const input: GenerateApiKeyInput = {
        duration: '1h',
      };
      const generated = service.generateApiKey(input);

      // Fast forward time to after expiration
      jest.setSystemTime(new Date('2024-01-01T02:00:00.000Z'));

      // Act
      const result: ValidateApiKeyResponse = service.validateApiKey(
        generated.apiKey,
      );

      // Assert
      expect(result.valid).toBe(false);
      expect(result.expiresAt).toBeUndefined();
      expect(result.remainingTime).toBeUndefined();
    });

    it('should return correct remaining time', () => {
      // Arrange
      const input: GenerateApiKeyInput = {
        duration: '1h',
      };
      const generated = service.generateApiKey(input);

      // Fast forward time to 30 minutes later
      jest.setSystemTime(new Date('2024-01-01T00:30:00.000Z'));

      // Act
      const result: ValidateApiKeyResponse = service.validateApiKey(
        generated.apiKey,
      );

      // Assert
      expect(result.valid).toBe(true);
      expect(result.remainingTime).toBe(1800); // 30 minutes remaining
    });

    it('should handle multiple API keys', () => {
      // Arrange
      const input1: GenerateApiKeyInput = { duration: '1h' };
      const input2: GenerateApiKeyInput = { duration: '24h' };

      const generated1 = service.generateApiKey(input1);
      const generated2 = service.generateApiKey(input2);

      // Act
      const result1 = service.validateApiKey(generated1.apiKey);
      const result2 = service.validateApiKey(generated2.apiKey);

      // Assert
      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
      expect(result1.remainingTime).toBe(3600);
      expect(result2.remainingTime).toBe(86400);
    });
  });
});
