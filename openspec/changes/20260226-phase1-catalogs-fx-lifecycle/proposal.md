## Why

Fase 1 requiere exponer endpoints funcionales de catálogo, tasas de cambio y lifecycle transaccional sobre el estado real del repo, manteniendo compatibilidad con el wizard ya implementado.

Estado confirmado de base:

- Prisma ya contiene `User`, `Beneficiary`, `Remittance`, `Transfer`.
- `Remittance` ya soporta wizard (origin fields, reception/card/holder) y usa `amount Decimal`, `currency`, `status`.
- GraphQL ya expone wizard y lectura (`createRemittanceDraft`, setters, `submitRemittance`, `myRemittance`, `myRemittances`).

Gaps de fase 1:

- No existen catálogos dinámicos para métodos de pago/recepción/monedas.
- No existe fuente de verdad para tasas de cambio con histórico.
- Lifecycle actual no cubre estados operativos de pago/confirmación/entrega/cancelación.
- Faltan endpoints admin/client para operar remesas como “transacciones”.

## Scope

Un solo change con cambios mínimos y contract-safe para habilitar:

1. Catálogos dinámicos en BD:
   - `PaymentMethod`
   - `ReceptionMethodCatalog` (nombre para evitar colisión con enum actual)
   - `CurrencyCatalog` (manteniendo enum actual mientras se migra gradualmente)
2. `ExchangeRate` con histórico y consulta de tasa vigente.
3. Evolución de `RemittanceStatus` para fase 1 (pago/confirmación/envío/éxito/cancelaciones).
4. Extensiones de `Remittance` para snapshot de tasa y metadatos de pago.
5. Endpoints GraphQL admin/client/públicos definidos en este documento.

## Compatibility Constraints

- Mantener firmas existentes del wizard siempre que sea posible.
- `submitRemittance(remittanceId): Boolean!` se mantiene, cambiando transición a `DRAFT -> PENDING_PAYMENT`.
- Sin refactors fuera de scope; patrón hexagonal existente (resolver -> use case -> ports -> adapters).
- Validación obligatoria code-first: `prisma generate`, `build`, `start:dev`, `schema.gql`.

## Out of Scope

- No rediseño de módulos ajenos.
- No tabla “transactions” duplicada (se usa `Remittance + Transfer`).
- No integraciones de pasarela/third-party reales; solo estado de negocio y catálogos.
- No hard-delete de histórico de tasas; `delete` en API puede ser soft-disable.