import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/login.input';
import { AuthResponse } from './dto/auth-response.type';

describe('AuthResolver', () => {
  let resolver: AuthResolver;

  const mockAuthService = {
    login: jest.fn(),
    refreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('login', () => {
    it('should call authService.login and return result', async () => {
      const loginInput: LoginInput = {
        identificationType: 'CC',
        identificationNumber: '12345678',
        password: 'password123',
      };

      const expectedResponse: AuthResponse = {
        token: 'jwt-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        userId: 'user-123',
        message: 'Login successful',
        user: {
          id: 'user-123',
          identificationType: 'CC',
          identificationNumber: '12345678',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      };

      mockAuthService.login.mockResolvedValue(expectedResponse);

      const result = await resolver.login(loginInput);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginInput);
      expect(mockAuthService.login).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from authService.login', async () => {
      const loginInput: LoginInput = {
        identificationType: 'CC',
        identificationNumber: '12345678',
        password: 'wrongpassword',
      };

      const error = new Error('Invalid credentials');
      mockAuthService.login.mockRejectedValue(error);

      await expect(resolver.login(loginInput)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(loginInput);
    });
  });

  describe('refreshToken', () => {
    it('should call authService.refreshToken and return result', async () => {
      const refreshTokenValue = 'refresh-token-123';
      const expectedResponse: AuthResponse = {
        token: 'new-jwt-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        userId: 'user-123',
        message: 'Token refreshed successfully',
      };

      mockAuthService.refreshToken.mockResolvedValue(expectedResponse);

      const result = await resolver.refreshToken(refreshTokenValue);

      expect(result).toEqual(expectedResponse);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        refreshTokenValue,
      );
      expect(mockAuthService.refreshToken).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from authService.refreshToken', async () => {
      const refreshTokenValue = 'invalid-refresh-token';
      const error = new Error('Token refresh failed');
      mockAuthService.refreshToken.mockRejectedValue(error);

      await expect(resolver.refreshToken(refreshTokenValue)).rejects.toThrow(
        'Token refresh failed',
      );
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        refreshTokenValue,
      );
    });
  });
});
