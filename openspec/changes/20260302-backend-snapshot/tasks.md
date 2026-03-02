# Tasks: backend snapshot

## Checklist de verificación del estado actual

- [x] Auditado `src/schema.gql` completo (mutations/queries por dominio).
- [x] Confirmado que `submitRemittanceV2` es el único flujo de creación de remesa expuesto.
- [x] Confirmada ausencia de `DRAFT` en `RemittanceStatus` de GraphQL.
- [x] Confirmada ausencia de `@deprecated` en schema GraphQL.
- [x] Confirmada existencia de `exchangeRates` público, `exchangeRate(from,to)` y `adminExchangeRates`.
- [x] Auditados flujos activos: auth, remittance wizardless, lifecycle, pricing preview, admin exchange rates, admin commission rules, admin delivery fees.
- [x] Auditado `src/prisma/schema.prisma` (modelos y relaciones activas).
- [x] Confirmada ausencia de modelo `Transfer`.
- [x] Confirmada presencia de `feesBreakdownJson` en `Remittance` y mapeo de montos API/DB (`paymentAmount/receivingAmount` vs `amount/netReceivingAmount`).
- [x] Mapeada arquitectura hexagonal para Remittances, ExchangeRates, Pricing, CommissionRules y DeliveryFees.
- [x] Verificados bindings de puertos/adapters activos por módulo en dominios auditados.
- [x] Registrado hallazgo de artefacto huérfano (`ExchangeRateSnapshotPort` / adapter).
- [x] Ejecutada revisión de marcadores `TODO/FIXME/XXX` en `src/**/*.ts` (sin hallazgos).
- [x] Generado baseline documental en `openspec/changes/20260302-backend-snapshot/`.

## Criterios de cierre del snapshot

- [x] No se modificaron archivos fuera de `openspec/`.
- [x] No se introdujeron cambios funcionales.
- [x] El contenido refleja el estado actual observado del código al 2026-03-02.
