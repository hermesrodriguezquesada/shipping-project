import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RemittancePaymentProofUploadPayload {
  @Field()
  uploadUrl!: string;

  @Field()
  key!: string;

  @Field()
  method!: string;

  @Field()
  expiresAt!: Date;
}
