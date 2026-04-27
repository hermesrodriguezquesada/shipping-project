# Proposal: exchange-rate-history-public-query

## Why

El backend ya administra tasas generales `ExchangeRate` y tasas VIP globales `VipExchangeRate`, pero no tiene una superficie inmutable para consultar cómo cambia el valor de una tasa a lo largo del tiempo. Se necesita ahora una capacidad pública de histórico por moneda sin mezclar ese comportamiento dentro de los módulos operativos existentes ni romper contratos actuales.

## What Changes

- Crear un módulo nuevo `src/modules/exchange-rate-history/` aislado de los módulos operativos actuales.
- Introducir una entidad append-only `ExchangeRateHistory` para snapshots de valor de tasa, con soporte para `GENERAL`, `VIP` y futuros tipos.
- Registrar snapshots automáticamente al crear una tasa y cuando cambia efectivamente `rate`.
- No permitir creación manual de histórico y no registrar cambios de `enabled` en fase 1.
- Exponer una query pública `exchangeRateHistory` sin auth con filtros por par de moneda, moneda flexible, tipos, rango temporal y paginación.
- Publicar solo entradas con `visibility = PUBLIC`.
- Mantener la solución aditiva y contract-safe, sin cambiar contratos existentes de `ExchangeRate`, `VipExchangeRate`, `pricingPreview` ni `vipProfitPreview`.

## Capabilities

### New Capabilities
- `exchange-rate-history`: Historical exchange-rate snapshots with automatic recording and public query filtering by currency, type, and date range.

### Modified Capabilities
- None.

## Impact

- New Prisma enum/model for append-only exchange-rate history.
- New module under `src/modules/exchange-rate-history/` with resolver, use-cases, ports, and Prisma adapters.
- Additive integration in `exchange-rates` and `vip-pricing` application flows via `ExchangeRateHistoryRecorderPort`.
- New public GraphQL query `exchangeRateHistory` and related input/output types.
- No breaking changes to existing operational models, pricing previews, or current GraphQL contracts.