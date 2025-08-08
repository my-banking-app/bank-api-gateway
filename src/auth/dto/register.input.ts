import { InputType, Field, Int } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsInt,
  IsBoolean,
  Min,
} from 'class-validator';

@InputType()
export class RegisterInput {
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
  firstName: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @Field(() => Int)
  @IsInt()
  @Min(18)
  age: number;

  @Field()
  @IsString()
  @IsNotEmpty()
  cityOfResidence: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  nationality: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  civilStatus: string;

  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  password: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  gender: string;

  @Field()
  @IsBoolean()
  dataProcessingAgreement: boolean;
}
