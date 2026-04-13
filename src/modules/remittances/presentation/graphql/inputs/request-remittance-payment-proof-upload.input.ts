import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

@InputType()
export class RequestRemittancePaymentProofUploadInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  remittanceId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(20 * 1024 * 1024)
  sizeBytes!: number;
}
