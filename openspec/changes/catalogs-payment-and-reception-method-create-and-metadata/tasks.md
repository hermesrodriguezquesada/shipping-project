# Tasks: catalogs payment and reception method create and metadata

## Implementation checklist
- [x] 1) Update Prisma schema
  - add `PaymentMethodType` enum (`PLATFORM`, `MANUAL`)
  - add `PaymentMethod.type`
  - add `PaymentMethod.additionalData`

- [x] 2) Create migration with deterministic backfill for existing payment methods
  - `ZELLE`, `IBAN`, `STRIPE` -> `PLATFORM`
  - unexpected existing codes -> explicit deterministic `MANUAL`
  - enforce `PaymentMethod.type` as `NOT NULL` after backfill

- [x] 3) Update catalogs query read models and adapters
  - include `type` and `additionalData` in payment method read model
  - ensure list/find payment method adapters return new metadata

- [x] 4) Update GraphQL `PaymentMethodType` output
  - expose non-null `type`
  - expose nullable `additionalData`

- [x] 5) Implement `adminCreatePaymentMethod`
  - input: `code`, `name`, `description?`, `additionalData?`, `imgUrl?`, `enabled?`
  - backend always persists `type=MANUAL`
  - do not accept `type` from caller

- [x] 6) Implement editing support for `PaymentMethod.additionalData`
  - add dedicated admin mutation/input for updating `additionalData`
  - keep existing `adminUpdatePaymentMethodDescription` flow working

- [x] 7) Implement `adminCreateReceptionMethod`
  - required: `code`, `name`, `currencyCode`, `method`
  - optional: `description?`, `imgUrl?`, `enabled?`
  - validate currency and method consistency using existing catalogs patterns

- [x] 8) Regenerate schema via
  - `npm run build`
  - `PORT=3001 npm run start:dev`
  - verify generated `src/schema.gql`

- [x] 9) Smoke tests
  - `paymentMethods` returns `type` and `additionalData`
  - `adminCreatePaymentMethod` creates with `MANUAL` type by default
  - admin update can change `additionalData`
  - `adminCreateReceptionMethod` creates a method visible in `receptionMethods`
