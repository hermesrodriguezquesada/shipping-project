# Proposal: remittance-commission-disable (CLOSED)

## Final status

Este change fue implementado y validado en su objetivo principal.

## Problem resolved

Se resolvió la necesidad de desactivar temporalmente la comisión efectiva en `submitRemittanceV2`, manteniendo operativo el resto del cálculo de pricing del submit.

Resultado observado en submit validado:

- `paymentAmount: "100"`
- `receivingAmount: "36500"`
- `appliedExchangeRate: "365"`

Y en `feesBreakdownJson`:

- `commission.ruleId = null`
- `commission.amount = "0"`
- `commission.currencyCode = null`
- `deliveryFee.amount = "0"` (según regla aplicable del caso probado)
- exchange rate presente y consistente

## Temporal scope confirmation

La desactivación de comisión se mantiene como decisión temporal y acotada al submit.

## Scope compliance

In-scope cumplido:

- `submitRemittanceV2`

Out-of-scope respetado:

- `pricingPreview`
- configuración/admin de commission rules
- Prisma schema y migraciones
- otras mutaciones de remesas
- delivery fees
- exchange rates
- `manualBeneficiary`
- `originAccountType`
- renames de campos de destino

## Non-impact confirmations

- No hubo cambios en Prisma schema.
- No hubo cambios en migraciones.
- No hubo cambios de contrato GraphQL funcional atribuibles a este change.
- `pricingPreview` quedó fuera del impacto funcional observado.

## Note about pricingPreview validation

La validación funcional end-to-end de `pricingPreview` quedó bloqueada por un problema runtime de validación del backend (`property amount should not exist`, etc.), ajeno al objetivo de este change.

Aun así, la introspección de `PricingPreviewInput` confirmó que el contrato GraphQL actual mantiene los campos esperados (`amount`, `city`, `country`, `holderType`, `paymentCurrencyCode`, `receivingCurrencyCode`, `region`).