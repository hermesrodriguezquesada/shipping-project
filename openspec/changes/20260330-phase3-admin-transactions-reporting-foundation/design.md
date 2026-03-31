# Design: Phase 3 Admin Transactions and Reporting Foundation

## Design status

FINALIZED - IMPLEMENTED.

## RF coverage

This design covers only:

- RF-033
- RF-038
- RF-039
- RF-040

## Transaction definition in this change

Administrative "transaction" is modeled as:

- Primary record: Remittance
- Associated payment context: zero or more ExternalPayment records related to that remittance

Design rule:

- Remittance remains the main aggregate and query anchor.
- External payments are exposed as associated operational/payment context, not as a separate primary reporting domain.

## Query taxonomy

Operational admin listing queries:

- Existing operational query remains (adminRemittances/adminRemittance).
- New consolidated operational listing is introduced for admin transaction analysis with richer filters and associated payment summary.

Reporting queries:

- Period bucket report query (RF-038)
- Aggregate amount stats query (RF-039)
- Payment method usage metrics query (RF-040)

## Proposed GraphQL additions

### Enums

- AdminReportGrouping:
  - DAILY
  - WEEKLY
  - MONTHLY

### Inputs

- AdminTransactionsFilterInput
  - dateFrom: DateTime (required)
  - dateTo: DateTime (required)
  - status: RemittanceStatus (optional)
  - userId: ID (optional)
  - paymentMethodCode: String (optional)
  - limit: Int (optional)
  - offset: Int (optional)

- AdminTransactionsPeriodReportInput
  - dateFrom: DateTime (required)
  - dateTo: DateTime (required)
  - grouping: AdminReportGrouping (required)
  - status: RemittanceStatus (optional)
  - userId: ID (optional)
  - paymentMethodCode: String (optional)

- AdminTransactionsAmountStatsInput
  - dateFrom: DateTime (required)
  - dateTo: DateTime (required)
  - status: RemittanceStatus (optional)
  - userId: ID (optional)
  - paymentMethodCode: String (optional)

- AdminPaymentMethodUsageInput
  - dateFrom: DateTime (required)
  - dateTo: DateTime (required)
  - status: RemittanceStatus (optional)
  - userId: ID (optional)

### Types

- AdminExternalPaymentSummaryType
  - provider
  - status
  - amount
  - currencyCode
  - checkoutUrl (nullable)
  - createdAt
  - updatedAt

- AdminTransactionType
  - remittance fields needed for admin list (id, status, sender info, amounts, method, createdAt/updatedAt)
  - externalPayment (nullable) as latest associated payment summary

- AdminTransactionsPeriodBucketType
  - bucketStart
  - bucketEnd
  - transactionCount

- AdminTransactionsAmountStatsType
  - totalSentAmount
  - totalSentCurrencyBreakdownJson (or typed list if preferred)
  - totalReceivedAmount
  - totalReceivedCurrencyBreakdownJson (or typed list if preferred)
  - remittanceCount

- AdminPaymentMethodUsageMetricType
  - paymentMethodCode
  - paymentMethodName
  - usageCount
  - usageSharePercent

### Query names

- adminTransactions(input: AdminTransactionsFilterInput!): [AdminTransactionType!]!
- adminTransactionsPeriodReport(input: AdminTransactionsPeriodReportInput!): [AdminTransactionsPeriodBucketType!]!
- adminTransactionsAmountStats(input: AdminTransactionsAmountStatsInput!): AdminTransactionsAmountStatsType!
- adminPaymentMethodUsageMetrics(input: AdminPaymentMethodUsageInput!): [AdminPaymentMethodUsageMetricType!]!

## Application architecture impact (hexagonal)

### Reuse

- Existing remittance query adapter for base remittance data
- Existing external payment adapter/model for associated payment data
- Existing auth/roles guard patterns for admin access

### New application pieces

- AdminTransactionsListUseCase
- AdminTransactionsPeriodReportUseCase
- AdminTransactionsAmountStatsUseCase
- AdminPaymentMethodUsageMetricsUseCase

### New ports or port extensions

- Extend RemittanceQueryPort with report/list methods supporting filters and grouped aggregates
- Add/extend external payment query projection for latest payment summary by remittance

### New adapters

- Prisma query methods for:
  - filtered consolidated remittance listing with associated latest external payment
  - grouped period counts (daily/weekly/monthly)
  - aggregate amounts sent/received
  - grouped usage by payment method

## Filter and grouping rules

Minimum required filters across reporting/listing:

- dateFrom/dateTo
- grouping (where applicable)
- status (optional)
- userId (optional)
- paymentMethodCode (optional)

Validation rules:

- dateFrom <= dateTo
- grouping required for period report only
- limit/offset bounded for operational listing

## Contract safety and compatibility

- No breaking changes in existing queries/mutations
- Existing adminRemittances/adminRemittance remain available
- Existing remittance lifecycle and submit flows remain unchanged
- Stripe/webhook flow remains unchanged; only read/report exposure is added

## Non-goals in this design

- Geographic stats (RF-041)
- Commission report (RF-042)
- Report export (RF-043)
- Frontend dashboard layout/UX

## Main implementation risks

- Period grouping consistency and timezone boundaries
- Efficient aggregate queries over remittance volume
- Ensuring latest external payment selection is deterministic and indexed-friendly

## Required validation

- npm run build
- PORT=3001 npm run start:dev
- verify src/schema.gql generated contract for all new types/queries
