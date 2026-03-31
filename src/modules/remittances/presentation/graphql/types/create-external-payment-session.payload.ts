import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ExternalPaymentProvider, ExternalPaymentStatus } from '@prisma/client';

@ObjectType()
export class CreateExternalPaymentSessionPayload {
  @Field(() => ID)
  paymentId!: string;

  @Field(() => ExternalPaymentProvider)
  provider!: ExternalPaymentProvider;

  @Field(() => ExternalPaymentStatus)
  status!: ExternalPaymentStatus;

  @Field(() => String, { nullable: true })
  checkoutUrl!: string | null;

  @Field(() => Date, { nullable: true })
  expiresAt!: Date | null;
}
