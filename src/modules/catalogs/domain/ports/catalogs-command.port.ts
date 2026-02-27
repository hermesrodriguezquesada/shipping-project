export interface CatalogsCommandPort {
  updatePaymentMethodDescription(input: { code: string; description: string | null }): Promise<void>;
  setPaymentMethodEnabled(input: { code: string; enabled: boolean }): Promise<void>;

  updateReceptionMethodDescription(input: { code: string; description: string | null }): Promise<void>;
  setReceptionMethodEnabled(input: { code: string; enabled: boolean }): Promise<void>;

  createCurrency(input: { code: string; name: string; description: string | null; imgUrl: string | null }): Promise<void>;
  updateCurrency(input: { code: string; name: string; description: string | null; imgUrl: string | null }): Promise<void>;
  setCurrencyEnabled(input: { code: string; enabled: boolean }): Promise<void>;
}
