import { registerEnumType } from '@nestjs/graphql';
import { UserActionAlertType } from '@prisma/client';

registerEnumType(UserActionAlertType, { name: 'UserActionAlertType' });