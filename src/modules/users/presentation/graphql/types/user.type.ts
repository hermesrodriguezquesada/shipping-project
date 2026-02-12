import { Field, ObjectType } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { GraphQLISODateTime } from '@nestjs/graphql';

@ObjectType()
export class UserType {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field(() => [Role])
  roles: Role[];

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

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
