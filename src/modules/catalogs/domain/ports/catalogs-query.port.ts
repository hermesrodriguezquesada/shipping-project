export interface PaymentMethodReadModel {
  id: string;
  code: string;
  name: string;
  description: string | null;
  enabled: boolean;
  imgUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReceptionMethodCatalogReadModel {
  id: string;
  code: string;
  name: string;
  description: string | null;
  enabled: boolean;
  imgUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CurrencyCatalogReadModel {
  id: string;
  code: string;
  name: string;
  description: string | null;
  enabled: boolean;
  imgUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogsQueryPort {
  listPaymentMethods(input: { enabledOnly?: boolean }): Promise<PaymentMethodReadModel[]>;
  findPaymentMethodByCode(input: { code: string }): Promise<PaymentMethodReadModel | null>;

  listReceptionMethods(input: { enabledOnly?: boolean }): Promise<ReceptionMethodCatalogReadModel[]>;
  findReceptionMethodByCode(input: { code: string }): Promise<ReceptionMethodCatalogReadModel | null>;

  listCurrencies(input: { enabledOnly?: boolean }): Promise<CurrencyCatalogReadModel[]>;
  findCurrencyByCode(input: { code: string }): Promise<CurrencyCatalogReadModel | null>;
  findCurrencyById(input: { id: string }): Promise<CurrencyCatalogReadModel | null>;
}
