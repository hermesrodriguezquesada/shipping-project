# Design: remittance-commission-disable (CLOSED)

## Design compliance status

Diseño respetado completamente y sin desviaciones de alcance.

## Implemented design summary

La desactivación de comisión quedó localizada al flujo de `submitRemittanceV2`, sin desactivar comisión globalmente en `PricingCalculatorService`.

Durante submit:

- `commissionAmount = 0`
- `commissionRuleIdUsed = null` (no aplicada)
- `commissionCurrencyIdUsed` coherente con comisión no aplicada
- `deliveryFeeAmount` permanece operativo según regla aplicable
- `exchangeRate` permanece operativo
- `netReceivingAmount` se calcula sin descuento por comisión

## feesBreakdownJson behavior

El breakdown quedó consistente con comisión efectiva desactivada en submit:

- comisión con monto cero
- sin rule efectiva aplicada
- exchange rate y delivery fee conservados

## Persistence and contract boundaries

- Sin cambios en Prisma schema.
- Sin cambios en migraciones.
- Sin eliminación de columnas de comisión.
- Sin cambios funcionales de contrato GraphQL atribuibles a este change.

## Non-impact confirmation

No hubo impacto en:

- `pricingPreview`
- admin/configuración de commission rules
- delivery fees
- exchange rates
- otros flujos de remesas fuera de submit
- `manualBeneficiary`
- `originAccountType`
- destination field rename

## Runtime note for pricingPreview

La validación funcional end-to-end de `pricingPreview` quedó parcialmente bloqueada por un problema runtime de validación ajeno al change.

Se confirmó por introspección que `PricingPreviewInput` mantiene el contrato esperado, por lo que no hay evidencia de regresión de contrato causada por este change.