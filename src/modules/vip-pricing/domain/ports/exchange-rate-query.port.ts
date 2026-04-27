export abstract class ExchangeRateQueryPort {
  abstract findRate(params: {
    fromCurrencyCode: string;
    toCurrencyCode: string;
  }): Promise<{ rate: string } | null>;
}