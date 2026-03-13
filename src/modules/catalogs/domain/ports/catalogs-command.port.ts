import { ReceptionPayoutMethod } from '@prisma/client';

export interface CatalogsCommandPort {
  createPaymentMethod(input: {
    code: string;
    name: string;
    description: string | null;
    additionalData: string | null;
    imgUrl: string | null;
    enabled: boolean;
  }): Promise<void>;

  updatePaymentMethodDescription(input: { code: string; description: string | null }): Promise<void>;
  updatePaymentMethodAdditionalData(input: { code: string; additionalData: string | null }): Promise<void>;
  setPaymentMethodEnabled(input: { code: string; enabled: boolean }): Promise<void>;

  createReceptionMethod(input: {
    code: string;
    name: string;
    currencyId: string;
    method: ReceptionPayoutMethod;
    description: string | null;
    imgUrl: string | null;
    enabled: boolean;
  }): Promise<void>;

  updateReceptionMethodDescription(input: { code: string; description: string | null }): Promise<void>;
  setReceptionMethodEnabled(input: { code: string; enabled: boolean }): Promise<void>;

  createCurrency(input: { code: string; name: string; description: string | null; imgUrl: string | null }): Promise<void>;
  updateCurrency(input: { code: string; name: string; description: string | null; imgUrl: string | null }): Promise<void>;
  setCurrencyEnabled(input: { code: string; enabled: boolean }): Promise<void>;
}
