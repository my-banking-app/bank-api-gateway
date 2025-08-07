import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ApiKeyGuard } from './api-key.guard';
import { ApiKeysService } from '../api-keys.service';
import { ValidateApiKeyResponse } from '../dto/api-key-response.type';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let apiKeysService: ApiKeysService;

  const mockApiKeysService = {
    validateApiKey: jest.fn(),
  };

  const mockRequest = {
    headers: {},
    apiKeyInfo: undefined,
  };

  const mockGqlExecutionContext = {
    getContext: jest.fn().mockReturnValue({ req: mockRequest }),
  };

  const mockExecutionContext = {
    switchToHttp: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
    getClass: jest.fn(),
    getHandler: jest.fn(),
  } as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        {
          provide: ApiKeysService,
          useValue: mockApiKeysService,
        },
      ],
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
    apiKeysService = module.get<ApiKeysService>(ApiKeysService);

    // Mock GqlExecutionContext.create
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockGqlExecutionContext as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Reset request headers
    mockRequest.headers = {};
    mockRequest.apiKeyInfo = undefined;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for valid API key', () => {
      // Arrange
      const validApiKey = 'bgw_validapikey123';
      mockRequest.headers['x-api-key'] = validApiKey;

      const validationResponse: ValidateApiKeyResponse = {
        valid: true,
        expiresAt: '2024-01-01T01:00:00.000Z',
        remainingTime: 3600,
      };

      mockApiKeysService.validateApiKey.mockReturnValue(validationResponse);

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
      expect(apiKeysService.validateApiKey).toHaveBeenCalledWith(validApiKey);
      expect(mockRequest.apiKeyInfo).toEqual({
        valid: true,
        expiresAt: '2024-01-01T01:00:00.000Z',
        remainingTime: 3600,
      });
    });

    it('should throw UnauthorizedException when API key is missing', () => {
      // Arrange
      // No API key in headers
      mockRequest.headers = {};

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        new UnauthorizedException('API Key requerida. Incluye x-api-key en los headers.'),
      );
      expect(apiKeysService.validateApiKey).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when API key is empty string', () => {
      // Arrange
      mockRequest.headers['x-api-key'] = '';

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        new UnauthorizedException('API Key requerida. Incluye x-api-key en los headers.'),
      );
      expect(apiKeysService.validateApiKey).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when API key is invalid', () => {
      // Arrange
      const invalidApiKey = 'bgw_invalidapikey123';
      mockRequest.headers['x-api-key'] = invalidApiKey;

      const validationResponse: ValidateApiKeyResponse = {
        valid: false,
      };

      mockApiKeysService.validateApiKey.mockReturnValue(validationResponse);

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        new UnauthorizedException('API Key inválida o expirada. Genera una nueva API key.'),
      );
      expect(apiKeysService.validateApiKey).toHaveBeenCalledWith(invalidApiKey);
    });

    it('should throw UnauthorizedException when API key is expired', () => {
      // Arrange
      const expiredApiKey = 'bgw_expiredapikey123';
      mockRequest.headers['x-api-key'] = expiredApiKey;

      const validationResponse: ValidateApiKeyResponse = {
        valid: false,
      };

      mockApiKeysService.validateApiKey.mockReturnValue(validationResponse);

      // Act & Assert
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        new UnauthorizedException('API Key inválida o expirada. Genera una nueva API key.'),
      );
      expect(apiKeysService.validateApiKey).toHaveBeenCalledWith(expiredApiKey);
    });

    it('should handle API key validation with partial response', () => {
      // Arrange
      const validApiKey = 'bgw_validapikey456';
      mockRequest.headers['x-api-key'] = validApiKey;

      const validationResponse: ValidateApiKeyResponse = {
        valid: true,
        expiresAt: '2024-01-01T01:00:00.000Z',
        // remainingTime is optional
      };

      mockApiKeysService.validateApiKey.mockReturnValue(validationResponse);

      // Act
      const result = guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
      expect(mockRequest.apiKeyInfo).toEqual({
        valid: true,
        expiresAt: '2024-01-01T01:00:00.000Z',
        remainingTime: undefined,
      });
    });

    it('should call GqlExecutionContext.create with correct context', () => {
      // Arrange
      const validApiKey = 'bgw_validapikey789';
      mockRequest.headers['x-api-key'] = validApiKey;

      const validationResponse: ValidateApiKeyResponse = {
        valid: true,
      };

      mockApiKeysService.validateApiKey.mockReturnValue(validationResponse);

      // Act
      guard.canActivate(mockExecutionContext);

      // Assert
      expect(GqlExecutionContext.create).toHaveBeenCalledWith(mockExecutionContext);
      expect(mockGqlExecutionContext.getContext).toHaveBeenCalled();
    });

    it('should handle different header case variations', () => {
      // Arrange
      const validApiKey = 'bgw_validapikey000';
      mockRequest.headers['X-API-KEY'] = validApiKey; // Different case

      const validationResponse: ValidateApiKeyResponse = {
        valid: true,
      };

      mockApiKeysService.validateApiKey.mockReturnValue(validationResponse);

      // Act & Assert
      // This should fail because we're looking for 'x-api-key' specifically
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        new UnauthorizedException('API Key requerida. Incluye x-api-key en los headers.'),
      );
    });
  });
});