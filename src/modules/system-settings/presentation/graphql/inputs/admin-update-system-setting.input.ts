import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class AdminUpdateSystemSettingInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  value!: string | null;
}
