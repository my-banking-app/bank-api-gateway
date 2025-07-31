import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field()
  id: string;

  @Field()
  identificationType: string;

  @Field()
  identificationNumber: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  age?: number;

  @Field({ nullable: true })
  cityOfResidence?: string;

  @Field({ nullable: true })
  nationality?: string;

  @Field({ nullable: true })
  phoneNumber?: string;

  @Field({ nullable: true })
  civilStatus?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  gender?: string;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field({ nullable: true })
  createdAt?: string;

  @Field({ nullable: true })
  updatedAt?: string;
}

@ObjectType()
export class AuthResponse {
  @Field()
  token: string;

  @Field()
  refreshToken?: string;

  @Field()
  expiresIn: number;

  @Field()
  tokenType: string;

  @Field()
  userId: string;

  @Field()
  message: string;

  @Field(() => User, { nullable: true })
  user?: User;
}
