import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class VipPaymentProofViewPayload {
  @Field()
  viewUrl!: string;

  @Field()
  expiresAt!: Date;
}