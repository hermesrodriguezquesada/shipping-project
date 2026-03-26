import { OriginAccountHolderType, Prisma } from '@prisma/client';
import { PricingPreviewUseCase } from './pricing-preview.usecase';

describe('PricingPreviewUseCase', () => {
  it('keeps commission behavior from pricing calculator', async () => {
    const pricingCalculator = {
      calculate: jest.fn().mockResolvedValue({
        commissionRuleId: 'commission-rule-1',
        commissionRuleVersion: 2,
        commissionAmount: new Prisma.Decimal('7.50'),
        deliveryFeeRuleId: 'delivery-fee-rule-1',
        deliveryFeeAmount: new Prisma.Decimal('2.00'),
        exchangeRateId: 'fx-1',
        exchangeRateValue: new Prisma.Decimal('350.12'),
        netReceivingAmount: new Prisma.Decimal('31635.84'),
      }),
    };

    const useCase = new PricingPreviewUseCase(pricingCalculator as any);

    const result = await useCase.execute({
      amount: '100',
      paymentCurrencyCode: 'usd',
      receivingCurrencyCode: 'cup',
      holderType: OriginAccountHolderType.PERSON,
      country: 'CU',
      region: 'HABANA',
      city: 'PLAYA',
    });

    expect(pricingCalculator.calculate).toHaveBeenCalledWith({
      amount: new Prisma.Decimal('100'),
      paymentCurrencyCode: 'usd',
      receivingCurrencyCode: 'cup',
      holderType: OriginAccountHolderType.PERSON,
      country: 'CU',
      region: 'HABANA',
      city: 'PLAYA',
    });

    expect(result.commissionAmount).toEqual(new Prisma.Decimal('7.50'));
    expect(result.commissionRuleId).toBe('commission-rule-1');
    expect(result.commissionRuleVersion).toBe(2);
    expect(result.commissionCurrencyCode).toBe('USD');
  });
});
