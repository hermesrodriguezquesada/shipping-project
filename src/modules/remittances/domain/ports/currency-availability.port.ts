export interface CurrencyRef {
  id: string;
  code: string;
  enabled: boolean;
}

export interface CurrencyAvailabilityPort {
  findEnabledCurrencyByCode(input: { code: string }): Promise<CurrencyRef | null>;
  findCurrencyById(input: { id: string }): Promise<CurrencyRef | null>;
}
