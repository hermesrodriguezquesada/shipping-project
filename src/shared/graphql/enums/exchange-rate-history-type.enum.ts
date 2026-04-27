import { registerEnumType } from '@nestjs/graphql';
import { ExchangeRateHistoryType } from '@prisma/client';

registerEnumType(ExchangeRateHistoryType, {
  name: 'ExchangeRateHistoryType',
});