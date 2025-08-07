import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ApiKeysService } from '../api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  canActivate(context: ExecutionContext): boolean {
    const ctx = GqlExecutionContext.create(context);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const request = ctx.getContext().req;

    // Extraer API key del header
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException(
        'API Key requerida. Incluye x-api-key en los headers.',
      );
    }

    // Validar API key
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const validation = this.apiKeysService.validateApiKey(apiKey);

    if (!validation.valid) {
      throw new UnauthorizedException(
        'API Key inválida o expirada. Genera una nueva API key.',
      );
    }

    // Agregar información de la API key al contexto para uso posterior
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    request.apiKeyInfo = {
      valid: validation.valid,
      expiresAt: validation.expiresAt,
      remainingTime: validation.remainingTime,
    };

    return true;
  }
}
