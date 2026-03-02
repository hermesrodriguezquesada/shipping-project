import { Module } from '@nestjs/common';
import { CommissionRulesModule } from '../commission-rules/commission-rules.module';
import { DeliveryFeesModule } from '../delivery-fees/delivery-fees.module';
import { ExchangeRatesModule } from '../exchange-rates/exchange-rates.module';
import { PricingCalculatorService } from './application/services/pricing-calculator.service';
import { PricingPreviewUseCase } from './application/use-cases/pricing-preview.usecase';
import { PricingResolver } from './presentation/graphql/resolvers/pricing.resolver';

@Module({
  imports: [CommissionRulesModule, DeliveryFeesModule, ExchangeRatesModule],
  providers: [PricingCalculatorService, PricingPreviewUseCase, PricingResolver],
  exports: [PricingCalculatorService],
})
export class PricingModule {}
