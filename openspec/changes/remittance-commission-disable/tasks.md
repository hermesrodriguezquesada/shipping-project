# Tasks: remittance-commission-disable (CLOSED)

## 1. Revisión de flujo

- [x] Revisado `SubmitRemittanceV2UseCase`.
- [x] Revisado `PricingCalculatorService`.

## 2. Implementación mínima y localizada

- [x] Comisión desactivada solo en `submitRemittanceV2`.
- [x] Sin desactivación global de comisión en `PricingCalculatorService`.
- [x] Delivery fee operativo durante submit.
- [x] Exchange rate operativo durante submit.
- [x] `netReceivingAmount` en submit sin descuento por comisión.

## 3. Persistencia y breakdown

- [x] `commissionAmount` persistido en cero para submit.
- [x] `commissionRuleIdUsed` tratado como no aplicado (`null`).
- [x] `commissionCurrencyIdUsed` coherente con comisión no aplicada.
- [x] `feesBreakdownJson` consistente con comisión efectiva desactivada.

## 4. Guardrails de alcance

- [x] Sin cambios en Prisma schema.
- [x] Sin cambios en migraciones.
- [x] Sin cambios en admin/config de commission rules.
- [x] Sin cambios en delivery fees.
- [x] Sin cambios en exchange rates.
- [x] Sin cambios en otros flujos de remesas fuera de submit.
- [x] Sin mezcla con otros pedidos de frontend.

## 5. Validación técnica

- [x] `npm run build`.
- [x] `PORT=3001 npm run start:dev`.
- [x] `src/schema.gql` consistente, sin cambios funcionales atribuibles al change.

## 6. Smoke tests

- [x] Submit validado: comisión efectiva en cero, flujo íntegro y persistencia coherente.
- [x] Submit validado: delivery fee y exchange rate operativos.
- [~] `pricingPreview` validación funcional end-to-end parcial por bloqueo runtime de validación ajeno al change.

## Nota explícita sobre pricingPreview

Se observó error runtime de validación del backend (`property amount should not exist`, `property paymentCurrencyCode should not exist`, etc.) al intentar validar funcionalmente `pricingPreview`.

Se confirmó por introspección que el contrato GraphQL de `PricingPreviewInput` mantiene los campos esperados. La limitación fue externa al alcance de este change.

## Estado final del change

- Implementado
- Validado funcionalmente en submit
- Acotado al alcance aprobado
- Listo para merge con nota documentada de validación parcial de pricingPreview