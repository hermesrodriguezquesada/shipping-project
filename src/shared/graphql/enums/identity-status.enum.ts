import { registerEnumType } from '@nestjs/graphql';
import { IdentityStatus } from '@prisma/client';

registerEnumType(IdentityStatus, { name: 'IdentityStatus' });
