import { Inject, Injectable, Logger } from '@nestjs/common';
import { InternalNotificationType, Prisma, Role } from '@prisma/client';
import { DomainException } from '../../../../core/exceptions/domain/domain.exception';
import { NotFoundDomainException } from '../../../../core/exceptions/domain/not-found.exception';
import { UnauthorizedDomainException } from '../../../../core/exceptions/domain/unauthorized.exception';
import { ValidationDomainException } from '../../../../core/exceptions/domain/validation.exception';
import { InternalNotificationCommandPort } from '../../../internal-notifications/domain/ports/internal-notification-command.port';
import { UserQueryPort } from '../../../users/domain/ports/user-query.port';
import { CatalogsQueryPort } from '../../../catalogs/domain/ports/catalogs-query.port';
import { ExchangeRateQueryPort } from '../../../vip-pricing/domain/ports/exchange-rate-query.port';
import { SystemSettingsQueryPort } from '../../../system-settings/domain/ports/system-settings-query.port';
import {
  CATALOGS_QUERY_PORT,
  INTERNAL_NOTIFICATION_COMMAND_PORT,
  PAYMENT_REQUEST_COMMAND_PORT,
  PAYMENT_REQUEST_QUERY_PORT,
  SYSTEM_SETTINGS_QUERY_PORT,
  USER_QUERY_PORT,
} from '../../../../shared/constants/tokens';
import { PaymentRequestCommandPort } from '../../domain/ports/payment-request-command.port';
import { PaymentRequestQueryPort } from '../../domain/ports/payment-request-query.port';
import { PaymentRequestEntity } from '../../domain/entities/payment-request.entity';

@Injectable()
export class CreatePaymentRequestUseCase {
  private readonly logger = new Logger(CreatePaymentRequestUseCase.name);

  constructor(
    @Inject(USER_QUERY_PORT)
    private readonly userQuery: UserQueryPort,
    @Inject(CATALOGS_QUERY_PORT)
    private readonly catalogsQuery: CatalogsQueryPort,
    @Inject(ExchangeRateQueryPort)
    private readonly exchangeRateQuery: ExchangeRateQueryPort,
    @Inject(SYSTEM_SETTINGS_QUERY_PORT)
    private readonly systemSettingsQuery: SystemSettingsQueryPort,
    @Inject(PAYMENT_REQUEST_COMMAND_PORT)
    private readonly command: PaymentRequestCommandPort,
    @Inject(PAYMENT_REQUEST_QUERY_PORT)
    private readonly query: PaymentRequestQueryPort,
    @Inject(INTERNAL_NOTIFICATION_COMMAND_PORT)
    private readonly notificationCommand: InternalNotificationCommandPort,
  ) {}

  async execute(input: {
    senderUserId: string;
    amount: string;
    currencyId: string;
    method: import('@prisma/client').PaymentRequestMethod;
    account?: string | null;
    address?: string | null;
    delivery: boolean;
  }): Promise<PaymentRequestEntity> {
    // 1. Fetch user and VIP check
    const user = await this.userQuery.findById(input.senderUserId);
    if (!user) throw new NotFoundDomainException('User not found');
    if (!user.isVip) throw new UnauthorizedDomainException('Only VIP users can create payment requests');

    // 2. Fetch currency
    const currency = await this.catalogsQuery.findCurrencyById({ id: input.currencyId });
    if (!currency) throw new NotFoundDomainException('Currency not found');
    if (!currency.enabled) throw new ValidationDomainException('Currency is not enabled');

    // 3. Fetch exchange rate (snapshot) from general ExchangeRate
    let exchangeRate = new Prisma.Decimal(1);
    if (currency.code !== 'USD') {
      const generalRate = await this.exchangeRateQuery.findRate({
        fromCurrencyCode: 'USD',
        toCurrencyCode: currency.code,
      });
      if (!generalRate) throw new ValidationDomainException('Exchange rate to USD not configured');
      exchangeRate = new Prisma.Decimal(generalRate.rate);
    }

    // 4. Read system settings
    const deliveryFeeUsdSetting = await this.systemSettingsQuery.findByName('CASH_DELIVERY_FEE_USD');
    const deliveryMinSetting = await this.systemSettingsQuery.findByName('CASH_DELIVERY_MIN_AMOUNT_USD');
    const deliveryFeeUsd = new Prisma.Decimal(deliveryFeeUsdSetting?.value ?? '10');
    const deliveryMinUsd = new Prisma.Decimal(deliveryMinSetting?.value ?? '1000');

    // 5. Validate amount
    const amountDecimal = new Prisma.Decimal(input.amount);
    if (!amountDecimal.gt(0)) throw new ValidationDomainException('amount must be greater than 0');

    const amountInUSD = amountDecimal.div(exchangeRate);
    const activeSum = await this.query.sumActiveAmountsUsd(input.senderUserId);
    const availableBalance = user.totalGeneratedAmount.minus(activeSum);

    if (amountInUSD.gt(availableBalance)) {
      throw new ValidationDomainException('Insufficient available VIP balance');
    }

    // 6. Validate method constraints
    if (input.method === 'TRANSFER') {
      if (!input.account || input.account.trim() === '') {
        throw new ValidationDomainException('account is required for TRANSFER method');
      }
      if (input.delivery) throw new DomainException('TRANSFER method does not support delivery');
      if (input.address) throw new DomainException('TRANSFER method does not support address');
    } else if (input.method === 'CASH') {
      if (input.account) throw new DomainException('CASH method does not allow account');
      if (input.delivery) {
        if (!input.address || input.address.trim() === '') {
          throw new ValidationDomainException('address is required for CASH with delivery');
        }
        if (!amountInUSD.gt(deliveryMinUsd)) {
          throw new ValidationDomainException('amount is below minimum required for delivery');
        }
      } else {
        if (input.address) throw new DomainException('address must be null for CASH without delivery');
      }
    }

    // 7. Compute delivery fee (in currency units)
    let deliveryFee = new Prisma.Decimal(0);
    if (input.delivery) {
      deliveryFee = deliveryFeeUsd.div(exchangeRate);
    }

    // 8. Compute amountToPay
    const amountToPay = amountDecimal.minus(deliveryFee);

    // 9. Persist
    const entity = await this.command.create({
      ownerUserId: input.senderUserId,
      amount: amountDecimal,
      currencyId: input.currencyId,
      exchangeRate,
      deliveryFee,
      amountToPay,
      method: input.method,
      account: input.account ?? null,
      address: input.address ?? null,
      delivery: input.delivery,
    });

    // 10. Notify admins (non-blocking)
    await this.notifyAdminsSafe(entity.id);

    return entity;
  }

  private async notifyAdminsSafe(referenceId: string): Promise<void> {
    try {
      const recipients = await this.userQuery.findMany(
        { role: Role.ADMIN, isDeleted: false },
        { limit: 200 },
      );
      await Promise.all(
        recipients.map((u) =>
          this.notificationCommand.create({
            userId: u.id,
            type: InternalNotificationType.NEW_PAYMENT_REQUEST,
            referenceId,
          }),
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Non-blocking notification failure for NEW_PAYMENT_REQUEST. referenceId=${referenceId} error=${message}`);
    }
  }
}
