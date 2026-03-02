# Proposal: pricing-commission-delivery-fees

## Why
El sistema ya tiene snapshot FX al submit y arquitectura hexagonal por módulos. Falta hacer configurable el pricing (comisiones + delivery fees), manteniendo contrato GraphQL existente y habilitando evolución futura de reglas administrables/versionadas.

## What changes
- Crear módulo `commission-rules` con reglas versionadas por moneda y tipo de holder.
- Crear módulo `delivery-fees` con reglas por ubicación (country/region/city).
- Crear módulo `pricing` con query `pricingPreview(input)` que no persiste remesas.
- Integrar cálculo de pricing en `submit-remittance` para persistir snapshots inmutables.
- Extender Prisma (`CommissionRule`, `DeliveryFeeRule`, snapshots en `Remittance`) + migración + seed.
- Agregar operaciones admin GraphQL para gestionar reglas de comisión y delivery fee.

## Constraints
- No romper nombres existentes de queries/mutations GraphQL.
- Commission aplica solo para `paymentCurrencyCode` en `{USD, EUR}`.
- Redondeo monetario a 2 decimales.
- Si no hay regla de delivery fee aplicable, fee = 0 y `ruleIdUsed = null`.
- Snapshots inmutables después de submit (no recálculo implícito).
