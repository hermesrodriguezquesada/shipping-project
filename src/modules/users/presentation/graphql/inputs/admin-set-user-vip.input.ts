import { Field, ID, InputType } from '@nestjs/graphql';
import { IsBoolean, IsUUID } from 'class-validator';

@InputType()
export class AdminSetUserVipInput {
  @Field(() => ID)
  @IsUUID()
  userId!: string;

  @Field()
  @IsBoolean()
  isVip!: boolean;
}
