import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty } from 'class-validator';

@InputType()
export class LoginInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  identificationType: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  identificationNumber: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  password: string;
}
