import { registerEnumType } from '@nestjs/graphql';
import { InternalNotificationType } from '@prisma/client';

registerEnumType(InternalNotificationType, { name: 'InternalNotificationType' });
