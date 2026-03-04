import { Field, ObjectType } from '@nestjs/graphql';
import { BeneficiaryRelationship, DocumentType } from '@prisma/client';

@ObjectType()
export class RemittanceRecipientType {
  @Field()
  fullName!: string;

  @Field()
  phone!: string;

  @Field()
  country!: string;

  @Field()
  addressLine1!: string;

  @Field()
  documentNumber!: string;

  @Field(() => String, { nullable: true })
  email?: string | null;

  @Field(() => String, { nullable: true })
  city?: string | null;

  @Field(() => String, { nullable: true })
  addressLine2?: string | null;

  @Field(() => String, { nullable: true })
  postalCode?: string | null;

  @Field(() => DocumentType, { nullable: true })
  documentType?: DocumentType | null;

  @Field(() => BeneficiaryRelationship, { nullable: true })
  relationship?: BeneficiaryRelationship | null;

  @Field(() => String, { nullable: true })
  deliveryInstructions?: string | null;
}
