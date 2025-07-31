import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/login.input';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('AuthService', () => {
  let service: AuthService;
  let httpService: HttpService;
  let configService: ConfigService;

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'AUTH_URL':
          return 'http://localhost:3001/auth/';
        case 'API_KEY':
          return 'test-api-key';
        case 'NODE_ENV':
          return 'test';
        default:
          return undefined;
      }
    });
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw error if AUTH_URL is not provided', () => {
    mockConfigService.get.mockReturnValue(undefined);
    expect(() => {
      new AuthService(httpService, configService);
    }).toThrow('AUTH_URL environment variable is required');
  });

  describe('login', () => {
    const loginInput: LoginInput = {
      identificationType: 'CC',
      identificationNumber: '12345678',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          id: 'user-123',
          token: 'jwt-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          message: 'Login successful',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as never,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.login(loginInput);

      expect(result).toEqual({
        token: 'jwt-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        userId: 'user-123',
        message: 'Login successful',
        user: {
          id: 'user-123',
          identificationType: '',
          identificationNumber: '',
          firstName: 'John',
          lastName: 'Doe',
          age: undefined,
          cityOfResidence: undefined,
          nationality: undefined,
          phoneNumber: undefined,
          civilStatus: undefined,
          email: 'john@example.com',
          gender: undefined,
        },
      });

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://localhost:3001/auth/login',
        {
          identificationType: 'CC',
          identificationNumber: '12345678',
          password: 'password123',
        },
        {
          headers: {
            'x-api-key': 'test-api-key',
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should handle 401 unauthorized error', async () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'Invalid credentials' },
        },
      };

      mockHttpService.post.mockReturnValue(throwError(() => error));

      await expect(service.login(loginInput)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should handle other HTTP errors', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };

      mockHttpService.post.mockReturnValue(throwError(() => error));

      await expect(service.login(loginInput)).rejects.toThrow(
        'Internal server error',
      );
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');

      mockHttpService.post.mockReturnValue(throwError(() => error));

      await expect(service.login(loginInput)).rejects.toThrow(
        'Service unavailable',
      );
    });

    it('should use default values when response data is incomplete', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          accessToken: 'access-token',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as never,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.login(loginInput);

      expect(result).toEqual({
        token: 'access-token',
        refreshToken: '',
        expiresIn: 3600,
        tokenType: 'Bearer',
        userId: '',
        message: 'Login successful',
        user: {
          id: '',
          identificationType: '',
          identificationNumber: '',
          firstName: undefined,
          lastName: undefined,
          age: undefined,
          cityOfResidence: undefined,
          nationality: undefined,
          phoneNumber: undefined,
          civilStatus: undefined,
          email: undefined,
          gender: undefined,
        },
      });
    });
  });

  describe('validateToken', () => {
    it('should successfully validate token', async () => {
      const mockResponse: AxiosResponse = {
        data: { valid: true, userId: 'user-123' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as never,
      };

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.validateToken('valid-token');

      expect(result).toEqual({ valid: true, userId: 'user-123' });
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'http://localhost:3001/auth/validate',
        {
          headers: {
            Authorization: 'Bearer valid-token',
            'x-api-key': 'test-api-key',
          },
        },
      );
    });

    it('should throw error when token validation fails', async () => {
      const error = new Error('Validation failed');
      mockHttpService.get.mockReturnValue(throwError(() => error));

      await expect(service.validateToken('invalid-token')).rejects.toThrow(
        'Token validation failed',
      );
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          token: 'new-jwt-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
          userId: 'user-123',
          message: 'Token refreshed successfully',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as never,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.refreshToken('refresh-token');

      expect(result).toEqual({
        token: 'new-jwt-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        userId: 'user-123',
        message: 'Token refreshed successfully',
      });

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://localhost:3001/auth/refresh',
        {
          refreshToken: 'refresh-token',
        },
        {
          headers: {
            'x-api-key': 'test-api-key',
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should handle refresh token failure', async () => {
      const error = new Error('Refresh failed');
      mockHttpService.post.mockReturnValue(throwError(() => error));

      await expect(
        service.refreshToken('invalid-refresh-token'),
      ).rejects.toThrow('Token refresh failed');
    });

    it('should use default values when refresh response is incomplete', async () => {
      const mockResponse: AxiosResponse = {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as never,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.refreshToken('refresh-token');

      expect(result).toEqual({
        token: '',
        refreshToken: '',
        expiresIn: 3600,
        tokenType: 'Bearer',
        userId: '',
        message: 'Token refreshed successfully',
      });
    });
  });
});
