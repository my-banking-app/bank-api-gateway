import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LoginInput } from './dto/login.input';
import { RegisterInput } from './dto/register.input';
import { AuthResponse } from './dto/auth-response.type';

interface AuthServiceResponse {
  id?: string;
  identificationType?: string;
  identificationNumber?: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  cityOfResidence?: string;
  nationality?: string;
  phoneNumber?: string;
  civilStatus?: string;
  email?: string;
  password?: string;
  gender?: string;
  isActive?: boolean;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  accessToken?: string;
  message?: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  user?: { id: string };
}

@Injectable()
export class AuthService {
  private readonly authServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    const authUrl = this.configService.get<string>('AUTH_URL');
    if (!authUrl) {
      throw new Error('AUTH_URL environment variable is required');
    }
    this.authServiceUrl = authUrl;
  }

  async login(loginInput: LoginInput): Promise<AuthResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<AuthServiceResponse>(
          `${this.authServiceUrl}login`,
          {
            identificationType: loginInput.identificationType,
            identificationNumber: loginInput.identificationNumber,
            password: loginInput.password,
          },
          {
            headers: {
              'x-api-key': this.configService.get<string>('API_KEY'),
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const data = response.data;
      return {
        token: data.token || data.accessToken || '',
        refreshToken: data.refreshToken || '',
        expiresIn: data.expiresIn || 3600,
        tokenType: data.tokenType || 'Bearer',
        userId: data.id || data.userId || data.user?.id || '',
        message: data.message || 'Login successful',
        user: {
          id: data.id || '',
          identificationType: data.identificationType || '',
          identificationNumber: data.identificationNumber || '',
          firstName: data.firstName,
          lastName: data.lastName,
          age: data.age,
          cityOfResidence: data.cityOfResidence,
          nationality: data.nationality,
          phoneNumber: data.phoneNumber,
          civilStatus: data.civilStatus,
          email: data.email,
          gender: data.gender,
        },
      };
    } catch (error: unknown) {
      if (this.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid credentials');
        } else if (error.response) {
          throw new Error(
            error.response.data?.message || 'Authentication failed',
          );
        }
      }
      throw new Error('Service unavailable');
    }
  }

  async register(registerInput: RegisterInput): Promise<AuthResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<AuthServiceResponse>(
          `${this.authServiceUrl}register`,
          {
            identificationType: registerInput.identificationType,
            identificationNumber: registerInput.identificationNumber,
            firstName: registerInput.firstName,
            lastName: registerInput.lastName,
            age: registerInput.age,
            cityOfResidence: registerInput.cityOfResidence,
            nationality: registerInput.nationality,
            phoneNumber: registerInput.phoneNumber,
            civilStatus: registerInput.civilStatus,
            email: registerInput.email,
            password: registerInput.password,
            gender: registerInput.gender,
            dataProcessingAgreement: registerInput.dataProcessingAgreement,
          },
          {
            headers: {
              'x-api-key': this.configService.get<string>('API_KEY'),
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const userData = response.data;
      return {
        token: userData.token || '',
        refreshToken: userData.refreshToken || null,
        expiresIn: userData.expiresIn || 3600,
        tokenType: userData.tokenType || 'Bearer',
        userId: userData.id || '',
        message: 'User registered successfully',
        user: {
          id: userData.id || '',
          identificationType: userData.identificationType || '',
          identificationNumber: userData.identificationNumber || '',
          firstName: userData.firstName,
          lastName: userData.lastName,
          age: userData.age,
          cityOfResidence: userData.cityOfResidence,
          nationality: userData.nationality,
          phoneNumber: userData.phoneNumber,
          civilStatus: userData.civilStatus,
          email: userData.email,
          gender: userData.gender,
          isActive: userData.isActive,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
        },
      };
    } catch (error: unknown) {
      if (this.isAxiosError(error)) {
        if (error.response?.status === 400) {
          throw new Error('Invalid registration data');
        } else if (error.response?.status === 409) {
          throw new Error('User already exists');
        } else if (error.response) {
          throw new Error(
            error.response.data?.message || 'Registration failed',
          );
        }
      }
      throw new Error('Registration service unavailable');
    }
  }

  private isAxiosError(error: unknown): error is {
    response?: {
      status: number;
      data?: { message?: string };
    };
  } {
    return error !== null && typeof error === 'object' && 'response' in error;
  }

  async validateToken(
    token: string,
  ): Promise<{ valid: boolean; userId: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<{ valid: boolean; userId: string }>(
          `${this.authServiceUrl}validate`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'x-api-key': this.configService.get<string>('API_KEY'),
            },
          },
        ),
      );
      return response.data;
    } catch {
      throw new Error('Token validation failed');
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.authServiceUrl}refresh`,
          {
            refreshToken,
          },
          {
            headers: {
              'x-api-key': this.configService.get<string>('API_KEY'),
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const data = response.data as AuthServiceResponse;
      return {
        token: data.token || '',
        refreshToken: data.refreshToken || '',
        expiresIn: data.expiresIn || 3600,
        tokenType: data.tokenType || 'Bearer',
        userId: data.userId || '',
        message: data.message || 'Token refreshed successfully',
        user: {
          id: data.id || '',
          identificationType: data.identificationType || '',
          identificationNumber: data.identificationNumber || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          age: data.age,
          cityOfResidence: data.cityOfResidence,
          nationality: data.nationality,
          phoneNumber: data.phoneNumber,
          civilStatus: data.civilStatus,
          email: data.email || '',
          gender: data.gender,
        },
      };
    } catch (error: unknown) {
      if (this.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid refresh token');
        } else if (error.response) {
          throw new Error(
            error.response.data?.message || 'Token refresh failed',
          );
        }
      }
      throw new Error('Token refresh failed');
    }
  }
}
