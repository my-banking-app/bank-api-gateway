import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class HealthStatus {
  @Field()
  status: string;

  @Field()
  timestamp: string;

  @Field()
  uptime: number;

  @Field()
  version: string;

  @Field()
  environment: string;

  @Field()
  graphqlEndpoint: string;
}
