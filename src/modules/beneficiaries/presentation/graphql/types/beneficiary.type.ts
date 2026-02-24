import { Field, ObjectType } from '@nestjs/graphql';
import { BeneficiaryRelationship, DocumentType } from '@prisma/client';

@ObjectType()
export class BeneficiaryType {
  @Field()
  id!: string;

  @Field()
  fullName!: string;

  @Field()
  phone!: string;

  @Field({ nullable: true })
  email?: string;

  @Field()
  country!: string;

  @Field({ nullable: true })
  city?: string;

  @Field()
  addressLine1!: string;

  @Field({ nullable: true })
  addressLine2?: string;

  @Field({ nullable: true })
  postalCode?: string;

  @Field(() => DocumentType, { nullable: true })
  documentType?: DocumentType;

  @Field()
  documentNumber!: string;

  @Field(() => BeneficiaryRelationship, { nullable: true })
  relationship?: BeneficiaryRelationship;

  @Field({ nullable: true })
  deliveryInstructions?: string;

  @Field() 
  isFavorite!: boolean;

  @Field({ nullable: true }) 
  favoriteAt?: Date;


  @Field({ nullable: true }) 
  timesUsed?: number;
  
  @Field({ nullable: true }) 
  lastUsedAt?: Date;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
