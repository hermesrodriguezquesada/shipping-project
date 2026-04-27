import { VipExchangeRateEntity } from 'src/modules/vip-pricing/domain/entities/vip-exchange-rate.entity';
import { VipExchangeRateType } from '../types/vip-exchange-rate.type';

export class VipExchangeRateMapper {
  static toGraphQL(entity: VipExchangeRateEntity): VipExchangeRateType {
    return {
      id: entity.id,
      fromCurrency: entity.fromCurrency,
      toCurrency: entity.toCurrency,
      rate: entity.rate.toString(),
      enabled: entity.enabled,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}