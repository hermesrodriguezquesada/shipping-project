import { registerEnumType } from '@nestjs/graphql';
import { UserActionLogAction } from '@prisma/client';

registerEnumType(UserActionLogAction, { name: 'UserActionLogAction' });