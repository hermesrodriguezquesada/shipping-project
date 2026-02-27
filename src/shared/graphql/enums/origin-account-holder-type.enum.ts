import { registerEnumType } from '@nestjs/graphql';
import { OriginAccountHolderType } from '@prisma/client';

registerEnumType(OriginAccountHolderType, { name: 'OriginAccountHolderType' });
