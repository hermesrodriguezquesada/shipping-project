import { Field, ObjectType } from '@nestjs/graphql';
import { IdentityStatus, DocumentType } from '@prisma/client';

@ObjectType()
export class IdentityVerificationType {
  @Field()
  userId!: string;

  @Field(() => IdentityStatus)
  status!: IdentityStatus;

  @Field(() => DocumentType, { nullable: true })
  documentType?: DocumentType;

  @Field({ nullable: true })
  documentNumber?: string;

  @Field({ nullable: true })
  fullName?: string;

  @Field({ nullable: true })
  birthDate?: Date;

  @Field({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  addressLine1?: string;

  @Field({ nullable: true })
  documentFrontUrl?: string;

  @Field({ nullable: true })
  documentBackUrl?: string;

  @Field({ nullable: true })
  selfieUrl?: string;

  @Field({ nullable: true })
  reviewedAt?: Date;

  @Field({ nullable: true })
  reviewedById?: string;

  @Field({ nullable: true })
  rejectionReason?: string;
}
