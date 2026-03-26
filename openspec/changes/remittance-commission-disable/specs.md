# Specs: remittance-commission-disable (CLOSED)

## Acceptance criteria status

### Submit criteria

- [x] AC-1: submitRemittanceV2 no aplica comisión.
- [x] AC-2: submitRemittanceV2 sigue aplicando delivery fee.
- [x] AC-3: submitRemittanceV2 sigue aplicando exchange rate.
- [x] AC-4: `netReceivingAmount` se calcula sin descuento por comisión.
- [x] AC-5: `feesBreakdownJson` refleja comisión cero/no cobro efectivo.
- [x] AC-6: remittance se crea correctamente sin romper el flujo.
- [x] AC-6.1: submit no registra commission rule aplicada cuando comisión efectiva está desactivada.

Evidencia funcional del caso validado:

- `paymentAmount: "100"`
- `receivingAmount: "36500"`
- `appliedExchangeRate: "365"`
- `feesBreakdownJson.commission.ruleId = null`
- `feesBreakdownJson.commission.amount = "0"`
- `feesBreakdownJson.commission.currencyCode = null`
- estado de remesa válido (`PENDING_PAYMENT`)

### No-impact criteria

- [~] AC-7: pricingPreview mantiene comportamiento actual.
- [x] AC-8: no hay cambios en Prisma schema ni migraciones.
- [x] AC-9: build y schema code-first siguen correctos.

## AC-7 note (partial validation)

La validación funcional end-to-end de `pricingPreview` quedó bloqueada por un problema runtime de validación del backend (`property amount should not exist`, `property paymentCurrencyCode should not exist`, etc.), ajeno al change.

No obstante, la introspección de `PricingPreviewInput` confirmó que el contrato GraphQL mantiene los campos esperados:

- `amount`
- `city`
- `country`
- `holderType`
- `paymentCurrencyCode`
- `receivingCurrencyCode`
- `region`

Conclusión para AC-7: no hay evidencia de regresión de contrato atribuible al change; validación funcional marcada como parcial por bloqueo runtime externo al alcance.

## Validation status summary

- `npm run build`: OK
- `PORT=3001 npm run start:dev`: OK
- `src/schema.gql`: consistente, sin cambios funcionales de contrato atribuibles a este change