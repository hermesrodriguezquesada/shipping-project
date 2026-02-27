import { registerEnumType } from '@nestjs/graphql';
import { OriginAccountType } from '@prisma/client';

registerEnumType(OriginAccountType, { name: 'OriginAccountType' });
