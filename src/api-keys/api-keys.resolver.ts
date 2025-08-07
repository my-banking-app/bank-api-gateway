import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { ApiKeysService } from './api-keys.service';
import { GenerateApiKeyInput } from './dto/generate-api-key.input';
import { ApiKeyResponse } from './dto/api-key-response.type';

@Resolver()
export class ApiKeysResolver {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Mutation(() => ApiKeyResponse)
  generateApiKey(@Args('input') input: GenerateApiKeyInput): ApiKeyResponse {
    return this.apiKeysService.generateApiKey(input);
  }
}
