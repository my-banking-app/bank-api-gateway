import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class ApiKeyResponse {
  @Field()
  apiKey: string;

  @Field()
  expiresAt: string;

  @Field()
  expiresIn: number;

  @Field()
  message: string;
}

@ObjectType()
export class ValidateApiKeyResponse {
  @Field()
  valid: boolean;

  @Field({ nullable: true })
  expiresAt?: string;

  @Field({ nullable: true })
  remainingTime?: number;
}
