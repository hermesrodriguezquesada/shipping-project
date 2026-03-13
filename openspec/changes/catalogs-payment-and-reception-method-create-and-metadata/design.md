# Design: catalogs payment and reception method create and metadata

## Overview
This change extends the existing catalogs module with additive metadata and admin create capabilities while preserving current patterns:
- resolver -> use-case -> ports -> Prisma adapters
- code-first GraphQL
- existing admin guards and role checks

## Prisma changes

### 1) New enum
Add a new Prisma enum:
- `PaymentMethodType`
  - `PLATFORM`
  - `MANUAL`

### 2) PaymentMethod model changes
Extend `PaymentMethod` with:
- `type PaymentMethodType` (NOT NULL after backfill)
- `additionalData String?` (nullable)

Recommended persistence safety:
- set DB default for `type` to `MANUAL` to protect against future incomplete writes.

## Migration and backfill strategy
Use deterministic SQL backfill to classify existing rows.

Backfill rule:
- `ZELLE`, `IBAN`, `STRIPE` -> `PLATFORM`
- any other existing code -> `MANUAL`

Deterministic sequence:
1. Create enum `PaymentMethodType`.
2. Add temporary nullable `PaymentMethod.type`.
3. Backfill with explicit `CASE` mapping by `code`.
4. Set `PaymentMethod.type` to `NOT NULL`.
5. Set default `MANUAL` for new rows.
6. Add nullable `PaymentMethod.additionalData`.

Unexpected existing codes policy:
- Default explicitly to `MANUAL` (deterministic, non-blocking).
- Do not fail migration.
- Record migration note for post-deploy audit query if needed.

## GraphQL changes (code-first)

### Payment method metadata output
Extend `PaymentMethodType` with:
- `type` (non-null enum)
- `additionalData` (nullable string)

GraphQL enum naming note:
- Since object type name is already `PaymentMethodType`, use a distinct GraphQL enum name (for example, `PaymentMethodKind`) to avoid naming collision.

### New admin mutations
1. `adminCreatePaymentMethod(input: AdminCreatePaymentMethodInput!): PaymentMethodType!`
2. `adminCreateReceptionMethod(input: AdminCreateReceptionMethodInput!): ReceptionMethodType!`

### Editing additionalData
Add a dedicated mutation/input for payment method metadata editing:
- `adminUpdatePaymentMethodAdditionalData(input: AdminUpdatePaymentMethodAdditionalDataInput!): PaymentMethodType!`

This keeps `adminUpdatePaymentMethodDescription` intact for backward compatibility and avoids overloading a description-specific mutation with unrelated semantics.

## Behavior and validation design

### adminCreatePaymentMethod
Input contract is intentionally minimal and does not accept `type`:
- `code`, `name` required
- `description?`, `additionalData?`, `imgUrl?`, `enabled?`

Rules:
- backend always persists `type=MANUAL`
- caller cannot override `type`
- normalize `code` to uppercase/trim
- require unique `code`
- `enabled` defaults to `true` when omitted

### adminUpdatePaymentMethodAdditionalData
Rules:
- require existing payment method by `code`
- allow nullable `additionalData` to support clearing
- do not alter `type`
- keep description update in its existing flow

### adminCreateReceptionMethod
Input required fields:
- `code`, `name`, `currencyCode`, `method`
Optional:
- `description?`, `imgUrl?`, `enabled?`

Rules:
- normalize `code` and `currencyCode`
- validate referenced currency exists (and keep current catalogs consistency behavior)
- validate `method` is valid `ReceptionPayoutMethod`
- enforce unique reception method code
- `enabled` defaults to `true` when omitted

## Application and adapter impacts

Presentation:
- `src/modules/catalogs/presentation/graphql/types/payment-method.type.ts`
- `src/modules/catalogs/presentation/graphql/resolvers/catalogs.resolver.ts`
- new inputs under `src/modules/catalogs/presentation/graphql/inputs/`

Application use-cases (new):
- `admin-create-payment-method.usecase.ts`
- `admin-update-payment-method-additional-data.usecase.ts`
- `admin-create-reception-method.usecase.ts`

Domain ports:
- `src/modules/catalogs/domain/ports/catalogs-command.port.ts`
  - add create payment method command
  - add update payment method additionalData command
  - add create reception method command
- `src/modules/catalogs/domain/ports/catalogs-query.port.ts`
  - extend `PaymentMethodReadModel` with `type` and `additionalData`
  - reuse existing lookup methods (`findPaymentMethodByCode`, `findCurrencyByCode`, `findReceptionMethodByCode`)

Infrastructure adapters:
- `src/modules/catalogs/infrastructure/adapters/prisma-catalogs-command.adapter.ts`
- `src/modules/catalogs/infrastructure/adapters/prisma-catalogs-query.adapter.ts`

Module wiring:
- `src/modules/catalogs/catalogs.module.ts` (register new use-cases)

Generated schema verification:
- `src/schema.gql` after build/start flow

## Out of scope
- No auth or guard modifications.
- No renaming/removal of existing admin mutations.
- No refactor of remittances, pricing, users, or exchange-rates modules.
- No generic metadata redesign beyond `additionalData: String?`.
