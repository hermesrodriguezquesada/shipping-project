import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

@InputType()
export class AdminCreateExchangeRateInput {
  @Field()
  @IsString()
  from!: string;

  @Field()
  @IsString()
  to!: string;

  @Field()
  @IsString()
  rate!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
