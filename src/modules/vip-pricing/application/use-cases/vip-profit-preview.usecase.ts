import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotFoundDomainException } from 'src/core/exceptions/domain/not-found.exception';
import { UnauthorizedDomainException } from 'src/core/exceptions/domain/unauthorized.exception';
import { ValidationDomainException } from 'src/core/exceptions/domain/validation.exception';
import { USER_QUERY_PORT, VIP_EXCHANGE_RATE_QUERY_PORT } from 'src/shared/constants/tokens';
import { UserQueryPort } from 'src/modules/users/domain/ports/user-query.port';
import { ExchangeRateQueryPort } from '../../domain/ports/exchange-rate-query.port';
import { VipExchangeRateQueryPort } from '../../domain/ports/vip-exchange-rate-query.port';

export interface VipProfitPreviewReadModel {
  paymentAmount: Prisma.Decimal;
  fromCurrencyCode: string;
  toCurrencyCode: string;
  baseRate: Prisma.Decimal;
  vipRate: Prisma.Decimal;
  rateDifference: Prisma.Decimal;
  vipProfitAmount: Prisma.Decimal;
  profitCurrencyCode: string;
}

@Injectable()
export class VipProfitPreviewUseCase {
  constructor(
    @Inject(USER_QUERY_PORT)
    private readonly usersQuery: UserQueryPort,
    @Inject(ExchangeRateQueryPort)
    private readonly exchangeRateQueryPort: ExchangeRateQueryPort,
    @Inject(VIP_EXCHANGE_RATE_QUERY_PORT)
    private readonly vipExchangeRateQuery: VipExchangeRateQueryPort,
  ) {}

  async execute(input: {
    userId: string;
    paymentAmount: string;
    fromCurrencyCode: string;
    toCurrencyCode: string;
  }): Promise<VipProfitPreviewReadModel> {
    const user = await this.usersQuery.findById(input.userId);
    if (!user) {
      throw new NotFoundDomainException('User not found');
    }

    if (!user.isVip) {
      throw new UnauthorizedDomainException('Forbidden');
    }

    const paymentAmount = this.parsePositiveDecimal(input.paymentAmount, 'paymentAmount');
    const fromCurrencyCode = input.fromCurrencyCode.trim().toUpperCase();
    const toCurrencyCode = input.toCurrencyCode.trim().toUpperCase();

    const baseRateRow = await this.exchangeRateQueryPort.findRate({
      fromCurrencyCode,
      toCurrencyCode,
    });
    if (!baseRateRow) {
      throw new ValidationDomainException('Base exchange rate not found');
    }

    const vipRate = await this.vipExchangeRateQuery.findByCurrencyPair({
      fromCurrencyCode,
      toCurrencyCode,
      enabledOnly: true,
    });
    if (!vipRate) {
      throw new ValidationDomainException('VIP rate not configured');
    }

    const baseRate = new Prisma.Decimal(baseRateRow.rate);
    const vipRateDecimal = new Prisma.Decimal(vipRate.rate.toString());
    const rateDifference = vipRateDecimal.minus(baseRate);
    const vipProfitAmount = rateDifference.lte(0) ? new Prisma.Decimal(0) : paymentAmount.mul(rateDifference);

    return {
      paymentAmount,
      fromCurrencyCode,
      toCurrencyCode,
      baseRate,
      vipRate: vipRateDecimal,
      rateDifference,
      vipProfitAmount,
      profitCurrencyCode: toCurrencyCode,
    };
  }

  private parsePositiveDecimal(value: string, field: string): Prisma.Decimal {
    const normalized = value?.trim();
    if (!normalized) {
      throw new ValidationDomainException(`${field} is required`);
    }

    try {
      const decimal = new Prisma.Decimal(normalized);
      if (!decimal.isFinite() || decimal.lte(0)) {
        throw new ValidationDomainException(`${field} must be greater than 0`);
      }
      return decimal;
    } catch {
      throw new ValidationDomainException(`${field} must be a valid decimal number`);
    }
  }
}