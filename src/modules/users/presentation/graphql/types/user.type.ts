import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { ClientType as UserClientType } from '@prisma/client';
import { GraphQLISODateTime } from '@nestjs/graphql';

registerEnumType(UserClientType, { name: 'ClientType' });

@ObjectType()
export class UserType {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field(() => String)
  role: string;

  @Field()
  isActive: boolean;

  @Field()
  isDeleted: boolean;

  @Field({ nullable: true }) 
  firstName?: string;

  @Field({ nullable: true }) 
  lastName?: string;

  @Field({ nullable: true }) 
  phone?: string;

  @Field(() => GraphQLISODateTime, { nullable: true }) 
  birthDate?: Date;

  @Field({ nullable: true }) 
  addressLine1?: string;
  
  @Field({ nullable: true }) 
  addressLine2?: string;

  @Field({ nullable: true }) 
  city?: string;

  @Field({ nullable: true }) 
  country?: string;

  @Field({ nullable: true }) 
  postalCode?: string;

  @Field(() => UserClientType)
  clientType: UserClientType;

  @Field({ nullable: true })
  companyName?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
