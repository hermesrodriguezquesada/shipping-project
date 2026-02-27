## Tasks

### 1) Prisma schema and migration

- Agregar modelos:
  - `PaymentMethod`
  - `ReceptionMethodCatalog`
  - `CurrencyCatalog`
  - `ExchangeRate`
- Extender `Remittance` con:
  - refs a catálogo de pago/recepción
  - `statusDescription`, `paymentDetails`
  - snapshot FX (`exchangeRateIdUsed`, `exchangeRateRateUsed`, `exchangeRateUsedAt`)
- Evolucionar `RemittanceStatus` a fase 1.
- Crear migración con backfill de estados legacy (`SUBMITTED/COMPLETED/CANCELLED`).

Definition of Done:

- migración versionada en `src/prisma/migrations/<timestamp>_phase1_catalogs_fx_lifecycle/migration.sql`.
- datos legacy mapeados sin pérdida de filas.

---

### 2) GraphQL enums/types (code-first)

- Agregar y registrar enums necesarios en `shared/graphql/enums`:
  - `RemittanceStatus` (nuevo set)
  - `TransferStatus` (si aplica en type)
  - `Currency` (si se expone)
- Crear types:
  - `PaymentMethodType`
  - `ReceptionMethodType`
  - `CurrencyType`
  - `ExchangeRateType`
- Extender `RemittanceType` con campos nuevos:
  - payment/reception refs o codes
  - `statusDescription`, `paymentDetails`
  - snapshot FX

Definition of Done:

- `schema.gql` contiene types y enums esperados.

---

### 3) Queries catalog + fx + admin remittances

Implementar use-cases, puertos y adapters para:

- `paymentMethods(enabledOnly)`
- `receptionMethods(enabledOnly)`
- `currencies(enabledOnly)`
- `exchangeRate(from,to)`
- `adminRemittances(limit,offset)`
- `adminRemittancesByUser(userId,limit,offset)`
- `adminRemittance(id)`

Reglas:

- ownership para client data.
- guard y roles para queries admin.
- orden por `createdAt desc` en listados admin remittance.

Definition of Done:

- queries operativas y tipadas en schema.

---

### 4) Mutations catalog + fx (admin)

Implementar:

- payment methods: update description + enable/disable.
- reception methods: update description + enable/disable.
- currencies: create/update/enable-disable.
- exchange rates: create/update/delete (soft-disable recomendado).

Definition of Done:

- validaciones de unicidad/estado aplicadas.
- protección `ADMIN` aplicada.

---

### 5) Remittance transaction lifecycle ops

Implementar:

- `submitRemittance`: `DRAFT -> PENDING_PAYMENT` (misma firma)
- `markRemittancePaid` (CLIENT)
- `adminConfirmRemittancePayment` (ADMIN)
- `cancelMyRemittance` (CLIENT)
- `adminCancelRemittance` (ADMIN)
- `adminMarkRemittanceDelivered` (ADMIN)

Reglas:

- ownership en client ops.
- validación estricta de transición por estado.
- snapshot FX guardado según política definida.

Definition of Done:

- transiciones inválidas devuelven `ValidationDomainException`.
- transiciones válidas persisten estado esperado.

---

### 6) Final validation checklist

- `npx prisma generate`
- `npm run build`
- `PORT=3001 npm run start:dev`
- Verificar `src/schema.gql` contiene:
  - types de catálogos + FX
  - queries de catálogos/FX/admin remittances
  - mutations admin/client de lifecycle
  - firma intacta de `submitRemittance(remittanceId: ID!): Boolean!`

Definition of Done:

- fase 1 completa en un único change, sin refactors fuera de scope y con compatibilidad funcional del wizard.