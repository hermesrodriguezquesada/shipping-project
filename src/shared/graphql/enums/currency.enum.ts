import { registerEnumType } from '@nestjs/graphql';
import { Currency } from '@prisma/client';

registerEnumType(Currency, { name: 'Currency' });
