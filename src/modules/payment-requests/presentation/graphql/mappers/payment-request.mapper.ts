import { PaymentRequestEntity } from '../../../domain/entities/payment-request.entity';
import { PaymentRequestType } from '../types/payment-request.type';

export class PaymentRequestMapper {
  static toType(entity: PaymentRequestEntity): PaymentRequestType {
    const type = new PaymentRequestType();
    type.id = entity.id;
    type.ownerUserId = entity.ownerUserId;
    type.amount = entity.amount.toString();
    type.currencyId = entity.currencyId;
    type.exchangeRate = entity.exchangeRate.toString();
    type.deliveryFee = entity.deliveryFee.toString();
    type.amountToPay = entity.amountToPay.toString();
    type.method = entity.method;
    type.account = entity.account;
    type.address = entity.address;
    type.delivery = entity.delivery;
    type.newAmount = entity.newAmount?.toString() ?? null;
    type.status = entity.status;
    type.reviewedById = entity.reviewedById;
    type.reviewedAt = entity.reviewedAt;
    type.paidById = entity.paidById;
    type.paidAt = entity.paidAt;
    type.canceledReason = entity.canceledReason;
    type.createdAt = entity.createdAt;
    type.updatedAt = entity.updatedAt;

    if (entity.owner) {
      type.owner = entity.owner as any;
    }
    if (entity.currency) {
      type.currency = entity.currency as any;
    }
    if (entity.reviewedBy !== undefined) {
      type.reviewedBy = entity.reviewedBy as any;
    }
    if (entity.paidBy !== undefined) {
      type.paidBy = entity.paidBy as any;
    }

    return type;
  }
}
