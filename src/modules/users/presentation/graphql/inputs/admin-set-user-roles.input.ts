import { Field, InputType } from '@nestjs/graphql';
import { Role } from '@prisma/client';

@InputType()
export class AdminSetUserRolesInput {
  @Field()
  userId!: string;

  @Field(() => [Role])
  roles!: Role[];
}
