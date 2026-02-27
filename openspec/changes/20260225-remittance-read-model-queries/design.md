## Overview

Se añade una capa de lectura mínima para remittances, reutilizando el módulo existente y patrón actual (resolver -> use-case -> ports -> prisma adapters).
El objetivo es que la UI consulte snapshot del wizard sin modificar las operaciones de escritura existentes.

## GraphQL Read Model

### RemittanceType

Campos propuestos:

- `id: ID!`
- `status: RemittanceStatus!`
- `amount: String!` (serializado desde Decimal)
- `currency: Currency!`
- `originAccountType: OriginAccountType`
- `originZelleEmail: String`
- `originIban: String`
- `originStripePaymentMethodId: String`
- `receptionMethod: ReceptionMethod`
- `destinationCupCardNumber: String`
- `originAccountHolderType: OriginAccountHolderType`
- `originAccountHolderFirstName: String`
- `originAccountHolderLastName: String`
- `originAccountHolderCompanyName: String`
- `beneficiary: BeneficiaryType!`
- `transfer: TransferType`
- `createdAt: DateTime!`
- `updatedAt: DateTime!`

### TransferType

- `status: TransferStatus!`
- `providerRef: String`
- `failureReason: String`
- `createdAt: DateTime!`
- `updatedAt: DateTime!`

## Queries

- `myRemittance(id: ID!): RemittanceType`
- `myRemittances(limit: Int, offset: Int): [RemittanceType!]!`

## Ownership and Security

- Resolver protegido con `GqlAuthGuard`.
- Lecturas filtradas por `senderUserId = currentUser.id`.
- `myRemittance` retorna `null` si no existe o no pertenece al usuario.

## Data Access (minimal)

Extender puertos/adapters de remittances para lectura:

- `findOneByIdAndSenderUser` para detalle.
- `findManyBySenderUser` para listado paginado con `limit/offset`.

Incluir relación `beneficiary` y `transfer` en consulta Prisma para evitar roundtrips.

## Mapping Rules

- `Decimal` -> `String` para `amount`.
- Campos opcionales pasan como `null` según estado del wizard.
- Mantener nombres de campos alineados con contrato propuesto para minimizar fricción en UI.

## Compatibility

- No se modifica firma de mutations existentes (`setRemittanceAmount`, `setRemittanceOriginAccount`, `setRemittanceReceptionMethod`, `setRemittanceDestinationCupCard`, `setRemittanceOriginAccountHolder`, `submitRemittance`).
- Sin cambios en Prisma schema para este change.