# Proposal: catalogs payment and reception method create and metadata

## Problem statement
The catalogs module currently supports listing and partial administration of payment and reception methods, but it is missing key metadata and creation operations.

Current limitations:
- `PaymentMethod` has no `type` classification (`PLATFORM` vs `MANUAL`).
- `PaymentMethod` has no `additionalData` field for admin-managed metadata.
- There is no `adminCreatePaymentMethod` mutation.
- There is no `adminCreateReceptionMethod` mutation.
- Payment method editing only supports `description`, not `additionalData`.

This forces operational catalog changes to happen via seed/migration/manual DB intervention instead of the existing admin GraphQL workflow.

## Why payment methods need type and additionalData
- `type` is required to separate platform-integrated payment methods (e.g., `ZELLE`, `IBAN`, `STRIPE`) from admin-defined manual methods.
- `additionalData` is required to persist operational notes or integration metadata without introducing ad-hoc schema changes for each new need.
- Relying only on `code` as an implicit classifier is brittle and leaks business assumptions into callers.

## Why create mutations are needed for payment and reception methods
- Admin users can currently enable/disable and edit description, but cannot create new records in either catalog.
- Product operations need runtime extensibility for new payment and payout channels.
- Adding create mutations keeps administration consistent with existing catalogs architecture and avoids out-of-band DB edits.

## Scope boundaries
In scope:
- Add Prisma enum `PaymentMethodType` and extend `PaymentMethod` with:
  - `type` (required)
  - `additionalData` (nullable)
- Add deterministic migration backfill for existing payment methods.
- Expose `type` and `additionalData` on GraphQL `PaymentMethodType`.
- Add admin mutation to create payment methods (always persisting `type=MANUAL`).
- Add admin mutation to update payment method `additionalData`.
- Add admin mutation to create reception methods.
- Keep existing list/update/enable flows working.

Out of scope:
- No auth/guard/RBAC changes.
- No redesign of catalogs module architecture.
- No unrelated refactors outside catalogs + minimal shared model updates.
- No frontend/UI changes.

## Risk assessment
- Migration risk: introducing non-null `PaymentMethod.type` requires safe deterministic backfill.
- Contract expansion risk: GraphQL clients that assume old `PaymentMethodType` shape may need query updates.
- Validation risk: create mutations must preserve existing uniqueness and currency/method consistency expectations.
- Operational risk: create endpoints increase mutation surface area; mitigated by existing admin guard pattern and input validation.
