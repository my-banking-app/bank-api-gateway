import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';
import { of, throwError as rxjsThrowError } from 'rxjs';
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

  beforeEach(async () => {
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

      mockHttpService.post.mockReturnValue(rxjsThrowError(() => error));

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

      mockHttpService.post.mockReturnValue(rxjsThrowError(() => error));

      await expect(service.login(loginInput)).rejects.toThrow(
        'Internal server error',
      );
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');

      mockHttpService.post.mockReturnValue(rxjsThrowError(() => error));

      await expect(service.login(loginInput)).rejects.toThrow(
        'Service unavailable',
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
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as never,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.refreshToken('old-refresh-token');

      expect(result).toEqual({
        token: 'new-jwt-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        userId: '',
        message: 'Token refreshed successfully',
        user: {
          id: '',
          identificationType: '',
          identificationNumber: '',
          firstName: '',
          lastName: '',
          age: undefined,
          cityOfResidence: undefined,
          nationality: undefined,
          phoneNumber: undefined,
          civilStatus: undefined,
          email: '',
          gender: undefined,
        },
      });

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://localhost:3001/auth/refresh',
        { refreshToken: 'old-refresh-token' },
        {
          headers: {
            'x-api-key': 'test-api-key',
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should handle refresh token errors', async () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'Invalid refresh token' },
        },
      };

      mockHttpService.post.mockReturnValue(rxjsThrowError(() => error));

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        'Invalid refresh token',
      );
    });
  });

  describe('register', () => {
    const registerInput: RegisterInput = {
      identificationType: 'CC',
      identificationNumber: '12345678',
      firstName: 'John',
      lastName: 'Doe',
      age: 25,
      cityOfResidence: 'Bogotá',
      nationality: 'Colombian',
      phoneNumber: '+573001234567',
      civilStatus: 'Single',
      email: 'john@example.com',
      password: 'password123',
      gender: 'MALE',
      dataProcessingAgreement: true,
    };

    it('should successfully register a new user', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          id: 'user-123',
          token: 'jwt-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer',
          identificationType: 'CC',
          identificationNumber: '12345678',
          firstName: 'John',
          lastName: 'Doe',
          age: 25,
          cityOfResidence: 'Bogotá',
          nationality: 'Colombian',
          phoneNumber: '+573001234567',
          civilStatus: 'Single',
          email: 'john@example.com',
          gender: 'MALE',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as never,
      };

      mockHttpService.post.mockReturnValue(of(mockResponse));

      const result = await service.register(registerInput);

      expect(result).toEqual({
        token: 'jwt-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        userId: 'user-123',
        message: 'User registered successfully',
        user: {
          id: 'user-123',
          identificationType: 'CC',
          identificationNumber: '12345678',
          firstName: 'John',
          lastName: 'Doe',
          age: 25,
          cityOfResidence: 'Bogotá',
          nationality: 'Colombian',
          phoneNumber: '+573001234567',
          civilStatus: 'Single',
          email: 'john@example.com',
          gender: 'MALE',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      });

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://localhost:3001/auth/register',
        {
          identificationType: 'CC',
          identificationNumber: '12345678',
          firstName: 'John',
          lastName: 'Doe',
          age: 25,
          cityOfResidence: 'Bogotá',
          nationality: 'Colombian',
          phoneNumber: '+573001234567',
          civilStatus: 'Single',
          email: 'john@example.com',
          password: 'password123',
          gender: 'MALE',
          dataProcessingAgreement: true,
        },
        {
          headers: {
            'x-api-key': 'test-api-key',
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('should handle 400 bad request error', async () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Invalid registration data' },
        },
      };

      mockHttpService.post.mockReturnValue(rxjsThrowError(() => error));

      await expect(service.register(registerInput)).rejects.toThrow(
        'Invalid registration data',
      );
    });

    it('should handle 409 conflict error (user already exists)', async () => {
      const error = {
        response: {
          status: 409,
          data: { message: 'User already exists' },
        },
      };

      mockHttpService.post.mockReturnValue(rxjsThrowError(() => error));

      await expect(service.register(registerInput)).rejects.toThrow(
        'User already exists',
      );
    });

    it('should handle other HTTP errors', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };

      mockHttpService.post.mockReturnValue(rxjsThrowError(() => error));

      await expect(service.register(registerInput)).rejects.toThrow(
        'Internal server error',
      );
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');

      mockHttpService.post.mockReturnValue(rxjsThrowError(() => error));

      await expect(service.register(registerInput)).rejects.toThrow(
        'Registration service unavailable',
      );
    });
  });
});
