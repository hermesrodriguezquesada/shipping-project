import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { REMITTANCE_COMMAND_PORT, REMITTANCE_QUERY_PORT } from 'src/shared/constants/tokens';
import { RemittanceCommandPort } from '../../domain/ports/remittance-command.port';
import {
  CurrencyCatalogReadModel,
  ExchangeRateReadModel,
  PaymentMethodReadModel,
  ReceptionMethodCatalogReadModel,
  RemittanceQueryPort,
} from '../../domain/ports/remittance-query.port';

@Injectable()
export class CatalogsAndFxUseCase {
  constructor(
    @Inject(REMITTANCE_QUERY_PORT)
    private readonly remittanceQuery: RemittanceQueryPort,
    @Inject(REMITTANCE_COMMAND_PORT)
    private readonly remittanceCommand: RemittanceCommandPort,
  ) {}

  listPaymentMethods(enabledOnly = true): Promise<PaymentMethodReadModel[]> {
    return this.remittanceQuery.listPaymentMethods({ enabledOnly });
  }

  listReceptionMethods(enabledOnly = true): Promise<ReceptionMethodCatalogReadModel[]> {
    return this.remittanceQuery.listReceptionMethods({ enabledOnly });
  }

  listCurrencies(enabledOnly = true): Promise<CurrencyCatalogReadModel[]> {
    return this.remittanceQuery.listCurrencies({ enabledOnly });
  }

  async getExchangeRate(from: string, to: string): Promise<ExchangeRateReadModel | null> {
    return this.remittanceQuery.getLatestExchangeRate({
      fromCode: from.trim().toUpperCase(),
      toCode: to.trim().toUpperCase(),
    });
  }

  async listExchangeRates(input: {
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }): Promise<ExchangeRateReadModel[]> {
    return this.remittanceQuery.listExchangeRates({
      fromCode: input.from?.trim().toUpperCase(),
      toCode: input.to?.trim().toUpperCase(),
      limit: input.limit,
      offset: input.offset,
    });
  }

  async updatePaymentMethodDescription(code: string, description?: string): Promise<void> {
    const normalizedCode = code.trim().toUpperCase();
    const existing = await this.remittanceQuery.findPaymentMethodByCode({ code: normalizedCode });
    if (!existing) throw new NotFoundDomainException('Payment method not found');

    await this.remittanceCommand.updatePaymentMethodDescription({
      code: normalizedCode,
      description: description?.trim() || null,
    });
  }

  async setPaymentMethodEnabled(code: string, enabled: boolean): Promise<void> {
    const normalizedCode = code.trim().toUpperCase();
    const existing = await this.remittanceQuery.findPaymentMethodByCode({ code: normalizedCode });
    if (!existing) throw new NotFoundDomainException('Payment method not found');

    await this.remittanceCommand.setPaymentMethodEnabled({ code: normalizedCode, enabled });
  }

  async updateReceptionMethodDescription(code: string, description?: string): Promise<void> {
    const normalizedCode = code.trim().toUpperCase();
    const existing = await this.remittanceQuery.findReceptionMethodByCode({ code: normalizedCode });
    if (!existing) throw new NotFoundDomainException('Reception method not found');

    await this.remittanceCommand.updateReceptionMethodDescription({
      code: normalizedCode,
      description: description?.trim() || null,
    });
  }

  async setReceptionMethodEnabled(code: string, enabled: boolean): Promise<void> {
    const normalizedCode = code.trim().toUpperCase();
    const existing = await this.remittanceQuery.findReceptionMethodByCode({ code: normalizedCode });
    if (!existing) throw new NotFoundDomainException('Reception method not found');

    await this.remittanceCommand.setReceptionMethodEnabled({ code: normalizedCode, enabled });
  }

  async createCurrency(input: { code: string; name: string; description?: string; imgUrl?: string }): Promise<void> {
    const code = input.code.trim().toUpperCase();

    if (!code || !input.name?.trim()) {
      throw new ValidationDomainException('code and name are required');
    }

    const existing = await this.remittanceQuery.findCurrencyByCode({ code });
    if (existing) {
      throw new ValidationDomainException('Currency code already exists');
    }

    await this.remittanceCommand.createCurrency({
      code,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      imgUrl: input.imgUrl?.trim() || null,
    });
  }

  async updateCurrency(input: { code: string; name: string; description?: string; imgUrl?: string }): Promise<void> {
    const code = input.code.trim().toUpperCase();
    const existing = await this.remittanceQuery.findCurrencyByCode({ code });
    if (!existing) throw new NotFoundDomainException('Currency not found');

    await this.remittanceCommand.updateCurrency({
      code,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      imgUrl: input.imgUrl?.trim() || null,
    });
  }

  async setCurrencyEnabled(code: string, enabled: boolean): Promise<void> {
    const normalizedCode = code.trim().toUpperCase();
    const existing = await this.remittanceQuery.findCurrencyByCode({ code: normalizedCode });
    if (!existing) throw new NotFoundDomainException('Currency not found');

    await this.remittanceCommand.setCurrencyEnabled({
      code: normalizedCode,
      enabled,
    });
  }

  async createExchangeRate(input: { from: string; to: string; rate: string; enabled?: boolean }): Promise<string> {
    const fromCode = input.from.trim().toUpperCase();
    const toCode = input.to.trim().toUpperCase();

    const fromCurrency = await this.remittanceQuery.findCurrencyByCode({ code: fromCode });
    const toCurrency = await this.remittanceQuery.findCurrencyByCode({ code: toCode });

    if (!fromCurrency || !fromCurrency.enabled) throw new ValidationDomainException('from currency is not enabled');
    if (!toCurrency || !toCurrency.enabled) throw new ValidationDomainException('to currency is not enabled');

    return this.remittanceCommand.createExchangeRate({
      fromCurrencyId: fromCurrency.id,
      toCurrencyId: toCurrency.id,
      rate: this.parseRate(input.rate),
      enabled: input.enabled ?? true,
    });
  }

  async updateExchangeRate(input: { id: string; rate: string; enabled?: boolean }): Promise<void> {
    await this.remittanceCommand.updateExchangeRate({
      id: input.id,
      rate: this.parseRate(input.rate),
      enabled: input.enabled,
    });
  }

  async deleteExchangeRate(id: string): Promise<void> {
    await this.remittanceCommand.deleteExchangeRate({ id });
  }

  private parseRate(value: string): Prisma.Decimal {
    const normalized = value?.trim();
    if (!normalized) throw new ValidationDomainException('rate is required');

    try {
      const rate = new Prisma.Decimal(normalized);
      if (!rate.isFinite() || rate.lte(0)) throw new ValidationDomainException('rate must be greater than 0');
      return rate;
    } catch {
      throw new ValidationDomainException('rate must be a valid decimal number');
    }
  }
}
