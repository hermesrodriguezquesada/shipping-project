import { registerEnumType } from '@nestjs/graphql';
import { SupportMessageStatus } from '@prisma/client';

registerEnumType(SupportMessageStatus, { name: 'SupportMessageStatus' });
