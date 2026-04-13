import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RemittancePaymentProofViewPayload {
  @Field()
  viewUrl!: string;

  @Field()
  expiresAt!: Date;
}
