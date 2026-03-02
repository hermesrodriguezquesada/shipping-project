# Design: pricing-commission-delivery-fees

## Architecture
Se agregan tres módulos hexagonales:

1. `commission-rules`
- `domain/ports`: query + command ports.
- `infrastructure/adapters`: Prisma adapters.
- `application/use-cases`: create/update(versionado), set-enabled, list.
- `presentation/graphql`: types/inputs/resolver admin.

2. `delivery-fees`
- `domain/ports`: query + command ports.
- `infrastructure/adapters`: Prisma adapters.
- `application/use-cases`: create/update/set-enabled/list.
- `presentation/graphql`: types/inputs/resolver admin.

3. `pricing`
- `application/services/pricing-calculator.service.ts` (núcleo de cálculo reutilizable).
- `application/use-cases/pricing-preview.usecase.ts`.
- `presentation/graphql`: `pricingPreview(input)`.

## Dependency direction (DIP)
- `pricing` depende solo de ports de consulta:
  - `CommissionRulesQueryPort`
  - `DeliveryFeesQueryPort`
  - `ExchangeRatesQueryPort`
- `remittances/submit` usa `PricingCalculatorService` para snapshot único al submit.

## Pricing rules (fase 1)
- Comisión:
  - base = `paymentCurrency` (USD/EUR).
  - regla inicial: si `amount > threshold` => `%`; si no => `flatFee`.
- Delivery fee:
  - matching por ubicación con prioridad: `city` > `region` > `country`.
  - sin regla aplicable: fee = 0.
- FX:
  - usa tasa habilitada más reciente (`from=paymentCurrencyCode`, `to=receivingCurrencyCode`).
- Net:
  - `netReceivingAmount = round2((amount - commission - deliveryFee) * fxRate)`.

## Snapshot immutability
En submit se persiste en `Remittance`:
- `commissionRuleIdUsed`, `commissionRuleVersionUsed`, `commissionAmount`, `commissionCurrencyIdUsed`
- `deliveryFeeRuleIdUsed`, `deliveryFeeAmount`, `deliveryFeeCurrencyIdUsed`
- `netReceivingAmount`, `netReceivingCurrencyIdUsed`
- además del snapshot FX existente.

No se recalcula automáticamente post-submit.

## Error strategy
- `paymentCurrencyCode` fuera de USD/EUR => error de validación claro.
- Sin exchange rate habilitado => error de validación.
- Sin comisión aplicable para moneda/tipo holder => error de validación.
