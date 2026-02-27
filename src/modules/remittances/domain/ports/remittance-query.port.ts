import {
  BeneficiaryRelationship,
  OriginAccountHolderType,
  Prisma,
  RemittanceStatus,
  TransferStatus,
  DocumentType,
} from '@prisma/client';
import {
  CurrencyCatalogReadModel,
  PaymentMethodReadModel,
  ReceptionMethodCatalogReadModel,
} from 'src/modules/catalogs/domain/ports/catalogs-query.port';
import { ExchangeRateReadModel } from 'src/modules/exchange-rates/domain/ports/exchange-rates-query.port';

export interface RemittanceForSubmit {
  id: string;
  status: RemittanceStatus;
  amount: Prisma.Decimal;
  currencyId: string | null;
  receivingCurrencyId: string | null;
  paymentMethodCode: string | null;
  originZelleEmail: string | null;
  originIban: string | null;
  originStripePaymentMethodId: string | null;
  receptionMethodCode: string | null;
  destinationCupCardNumber: string | null;
  originAccountHolderType: OriginAccountHolderType | null;
  originAccountHolderFirstName: string | null;
  originAccountHolderLastName: string | null;
  originAccountHolderCompanyName: string | null;
}

export interface RemittanceBeneficiaryReadModel {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  country: string;
  city: string | null;
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string | null;
  documentType: DocumentType | null;
  documentNumber: string;
  relationship: BeneficiaryRelationship | null;
  deliveryInstructions: string | null;
  isFavorite: boolean;
  favoriteAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RemittanceTransferReadModel {
  status: TransferStatus;
  providerRef: string | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RemittanceReadModel {
  id: string;
  status: RemittanceStatus;
  amount: Prisma.Decimal;
  paymentMethodCode: string | null;
  originZelleEmail: string | null;
  originIban: string | null;
  originStripePaymentMethodId: string | null;
  receptionMethodCode: string | null;
  destinationCupCardNumber: string | null;
  originAccountHolderType: OriginAccountHolderType | null;
  originAccountHolderFirstName: string | null;
  originAccountHolderLastName: string | null;
  originAccountHolderCompanyName: string | null;
  paymentDetails: string | null;
  statusDescription: string | null;
  exchangeRateIdUsed: string | null;
  exchangeRateRateUsed: Prisma.Decimal | null;
  exchangeRateUsedAt: Date | null;
  paymentMethod: PaymentMethodReadModel | null;
  receptionMethodCatalog: ReceptionMethodCatalogReadModel | null;
  paymentCurrency: CurrencyCatalogReadModel | null;
  receivingCurrency: CurrencyCatalogReadModel | null;
  exchangeRateUsed: ExchangeRateReadModel | null;
  beneficiary: RemittanceBeneficiaryReadModel;
  transfer: RemittanceTransferReadModel | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RemittanceQueryPort {
  findByIdAndSenderUser(input: { id: string; senderUserId: string }): Promise<RemittanceForSubmit | null>;
  findMyRemittanceById(input: { id: string; senderUserId: string }): Promise<RemittanceReadModel | null>;
  listMyRemittances(input: { senderUserId: string; limit?: number; offset?: number }): Promise<RemittanceReadModel[]>;
  listRemittances(input: { limit?: number; offset?: number }): Promise<RemittanceReadModel[]>;
  listRemittancesByUser(input: { userId: string; limit?: number; offset?: number }): Promise<RemittanceReadModel[]>;
  findRemittanceById(input: { id: string }): Promise<RemittanceReadModel | null>;
  beneficiaryBelongsToUser(input: { beneficiaryId: string; ownerUserId: string }): Promise<boolean>;
}
