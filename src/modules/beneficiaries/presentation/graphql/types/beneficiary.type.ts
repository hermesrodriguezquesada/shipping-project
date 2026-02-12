import { Field, ObjectType } from '@nestjs/graphql';
import { BeneficiaryRelationship, DocumentType } from '@prisma/client';

@ObjectType()
export class BeneficiaryType {
  @Field()
  id!: string;

  @Field()
  fullName!: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  email?: string;

  @Field()
  country!: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  addressLine1?: string;

  @Field({ nullable: true })
  postalCode?: string;

  @Field(() => DocumentType, { nullable: true })
  documentType?: DocumentType;

  @Field({ nullable: true })
  documentNumber?: string;

  @Field(() => BeneficiaryRelationship, { nullable: true })
  relationship?: BeneficiaryRelationship;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
