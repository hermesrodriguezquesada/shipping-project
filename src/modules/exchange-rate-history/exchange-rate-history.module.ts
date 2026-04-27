import { Module } from '@nestjs/common';
import {
  EXCHANGE_RATE_HISTORY_QUERY_PORT,
  EXCHANGE_RATE_HISTORY_RECORDER_PORT,
} from 'src/shared/constants/tokens';
import { ListPublicExchangeRateHistoryUseCase } from './application/use-cases/list-public-exchange-rate-history.usecase';
import { RecordExchangeRateHistoryUseCase } from './application/use-cases/record-exchange-rate-history.usecase';
import { PrismaExchangeRateHistoryQueryAdapter } from './infrastructure/adapters/prisma-exchange-rate-history-query.adapter';
import { PrismaExchangeRateHistoryRecorderAdapter } from './infrastructure/adapters/prisma-exchange-rate-history-recorder.adapter';
import { ExchangeRateHistoryResolver } from './presentation/graphql/resolvers/exchange-rate-history.resolver';

@Module({
  providers: [
    PrismaExchangeRateHistoryRecorderAdapter,
    PrismaExchangeRateHistoryQueryAdapter,
    {
      provide: EXCHANGE_RATE_HISTORY_QUERY_PORT,
      useExisting: PrismaExchangeRateHistoryQueryAdapter,
    },
    RecordExchangeRateHistoryUseCase,
    {
      provide: EXCHANGE_RATE_HISTORY_RECORDER_PORT,
      useExisting: RecordExchangeRateHistoryUseCase,
    },
    ListPublicExchangeRateHistoryUseCase,
    ExchangeRateHistoryResolver,
  ],
  exports: [EXCHANGE_RATE_HISTORY_RECORDER_PORT, EXCHANGE_RATE_HISTORY_QUERY_PORT],
})
export class ExchangeRateHistoryModule {}