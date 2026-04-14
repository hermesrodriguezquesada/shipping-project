import { Field, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

@InputType()
export class MyNotificationsInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
