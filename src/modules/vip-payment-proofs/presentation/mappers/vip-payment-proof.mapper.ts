import { CurrencyCatalogType } from '../../../catalogs/presentation/graphql/types/currency-catalog.type';
import { UserMapper } from '../../../users/presentation/mappers/user.mapper';
import { VipPaymentProofEntity } from '../../domain/entities/vip-payment-proof.entity';
import { VipPaymentProofType } from '../graphql/types/vip-payment-proof.type';

export class VipPaymentProofMapper {
  static toGraphQL(entity: VipPaymentProofEntity): VipPaymentProofType {
    if (!entity.user) {
      throw new Error(`VipPaymentProof ${entity.id} is missing user`);
    }

    if (!entity.currency) {
      throw new Error(`VipPaymentProof ${entity.id} is missing currency`);
    }

    return {
      id: entity.id,
      userId: entity.userId,
      user: UserMapper.toGraphQL(entity.user),
      accountHolderName: entity.accountHolderName,
      amount: entity.amount.toString(),
      currencyId: entity.currencyId,
      currency: entity.currency as CurrencyCatalogType,
      status: entity.status,
      cancelReason: entity.cancelReason ?? undefined,
      reviewedById: entity.reviewedById ?? undefined,
      reviewedBy: entity.reviewedBy ? UserMapper.toGraphQL(entity.reviewedBy) : undefined,
      reviewedAt: entity.reviewedAt ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}