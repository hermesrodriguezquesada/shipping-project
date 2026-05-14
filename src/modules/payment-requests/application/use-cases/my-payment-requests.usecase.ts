import { Inject, Injectable } from '@nestjs/common';
import { NotFoundDomainException } from '../../../../core/exceptions/domain/not-found.exception';
import { UnauthorizedDomainException } from '../../../../core/exceptions/domain/unauthorized.exception';
import { UserQueryPort } from '../../../users/domain/ports/user-query.port';
import { USER_QUERY_PORT, PAYMENT_REQUEST_QUERY_PORT } from '../../../../shared/constants/tokens';
import { PaymentRequestQueryPort, PaymentRequestFilters, PaymentRequestPagination } from '../../domain/ports/payment-request-query.port';
import { PaymentRequestEntity } from '../../domain/entities/payment-request.entity';

@Injectable()
export class MyPaymentRequestsUseCase {
  constructor(
    @Inject(USER_QUERY_PORT)
    private readonly userQuery: UserQueryPort,
    @Inject(PAYMENT_REQUEST_QUERY_PORT)
    private readonly query: PaymentRequestQueryPort,
  ) {}

  async execute(
    input: { userId: string } & PaymentRequestFilters & PaymentRequestPagination,
  ): Promise<PaymentRequestEntity[]> {
    const user = await this.userQuery.findById(input.userId);
    if (!user) throw new NotFoundDomainException('User not found');
    if (!user.isVip) throw new UnauthorizedDomainException('Only VIP users can view payment requests');

    const { userId, offset, limit, ...filters } = input;
    return this.query.findMany({ ownerUserId: userId, ...filters }, { offset, limit });
  }
}
