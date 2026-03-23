export interface ElToqueRatesPort {
  getRates(params: { dateFrom?: string; dateTo?: string }): Promise<string>;
}
