import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { PaymentRequestMethod, PaymentRequestStatus } from '@prisma/client';
import { IsDate, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class AdminPaymentRequestsInput {
  @Field(() => PaymentRequestStatus, { nullable: true })
  @IsOptional()
  @IsEnum(PaymentRequestStatus)
  status?: PaymentRequestStatus;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @Field(() => PaymentRequestMethod, { nullable: true })
  @IsOptional()
  @IsEnum(PaymentRequestMethod)
  method?: PaymentRequestMethod;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateFrom?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateTo?: Date;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
