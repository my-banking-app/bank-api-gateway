import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

@InputType()
export class GenerateApiKeyInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @IsIn(['1h', '24h', '7d', '30d'], {
    message: 'Duration must be one of: 1h, 24h, 7d, 30d',
  })
  duration: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;
}
