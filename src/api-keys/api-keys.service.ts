import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import { GenerateApiKeyInput } from './dto/generate-api-key.input';
import {
  ApiKeyResponse,
  ValidateApiKeyResponse,
} from './dto/api-key-response.type';

interface ApiKeyData {
  id: string;
  hashedKey: string;
  description?: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

@Injectable()
export class ApiKeysService {
  // In-memory storage para desarrollo - en producción usar Redis
  private readonly apiKeys = new Map<string, ApiKeyData>();
  private readonly expirationTimers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly configService: ConfigService) {}

  generateApiKey(input: GenerateApiKeyInput): ApiKeyResponse {
    // Generar API key única
    const apiKey = this.generateUniqueApiKey();
    const hashedKey = this.hashApiKey(apiKey);
    const id = randomBytes(16).toString('hex');

    // Calcular fecha de expiración
    const expiresAt = this.calculateExpirationDate(input.duration);
    const expiresIn = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

    // Crear registro de API key
    const apiKeyData: ApiKeyData = {
      id,
      hashedKey,
      description: input.description,
      createdAt: new Date(),
      expiresAt,
      isActive: true,
    };

    // Almacenar en memoria
    this.apiKeys.set(hashedKey, apiKeyData);

    // Configurar timer para auto-expiración
    this.setExpirationTimer(hashedKey, expiresAt);

    return {
      apiKey,
      expiresAt: expiresAt.toISOString(),
      expiresIn,
      message: 'API Key generada exitosamente',
    };
  }

  validateApiKey(apiKey: string): ValidateApiKeyResponse {
    const hashedKey = this.hashApiKey(apiKey);
    const apiKeyData = this.apiKeys.get(hashedKey);

    if (!apiKeyData?.isActive) {
      return {
        valid: false,
      };
    }

    // Verificar si ha expirado
    if (apiKeyData.expiresAt <= new Date()) {
      // Marcar como inactiva y limpiar
      apiKeyData.isActive = false;
      this.cleanupExpiredKey(hashedKey);
      return {
        valid: false,
      };
    }

    const remainingTime = Math.floor(
      (apiKeyData.expiresAt.getTime() - Date.now()) / 1000,
    );

    return {
      valid: true,
      expiresAt: apiKeyData.expiresAt.toISOString(),
      remainingTime,
    };
  }

  private generateUniqueApiKey(): string {
    const prefix = this.configService.get<string>('API_KEY_PREFIX') || 'bgw';
    const randomPart = randomBytes(32).toString('hex');
    return `${prefix}_${randomPart}`;
  }

  private hashApiKey(apiKey: string): string {
    return createHash('sha256').update(apiKey).digest('hex');
  }

  private calculateExpirationDate(duration: string): Date {
    const now = new Date();

    switch (duration) {
      case '1h':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case '24h':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      default:
        throw new Error(`Duración no válida: ${duration}`);
    }
  }

  private setExpirationTimer(hashedKey: string, expiresAt: Date): void {
    const timeUntilExpiration = expiresAt.getTime() - Date.now();

    if (timeUntilExpiration > 0) {
      const timer = setTimeout(() => {
        this.cleanupExpiredKey(hashedKey);
      }, timeUntilExpiration);

      this.expirationTimers.set(hashedKey, timer);
    }
  }

  private cleanupExpiredKey(hashedKey: string): void {
    // Limpiar timer
    const timer = this.expirationTimers.get(hashedKey);
    if (timer) {
      clearTimeout(timer);
      this.expirationTimers.delete(hashedKey);
    }

    // Remover de almacenamiento
    this.apiKeys.delete(hashedKey);
  }
}
