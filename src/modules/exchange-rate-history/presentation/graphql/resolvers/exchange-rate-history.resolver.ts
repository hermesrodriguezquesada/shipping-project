import { Args, Query, Resolver } from '@nestjs/graphql';
import { ListPublicExchangeRateHistoryUseCase } from 'src/modules/exchange-rate-history/application/use-cases/list-public-exchange-rate-history.usecase';
import { ExchangeRateHistoryMapper } from '../mappers/exchange-rate-history.mapper';
import { ExchangeRateHistoryInput } from '../inputs/exchange-rate-history.input';
import { ExchangeRateHistoryItemType } from '../types/exchange-rate-history-item.type';

@Resolver(() => ExchangeRateHistoryItemType)
export class ExchangeRateHistoryResolver {
  constructor(private readonly listPublicExchangeRateHistoryUseCase: ListPublicExchangeRateHistoryUseCase) {}

  @Query(() => [ExchangeRateHistoryItemType], { name: 'exchangeRateHistory' })
  async exchangeRateHistory(@Args('input') input: ExchangeRateHistoryInput): Promise<ExchangeRateHistoryItemType[]> {
    const rows = await this.listPublicExchangeRateHistoryUseCase.execute(input);
    return rows.map(ExchangeRateHistoryMapper.toGraphQL);
  }
}