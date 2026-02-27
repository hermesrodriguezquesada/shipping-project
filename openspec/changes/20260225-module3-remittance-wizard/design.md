## Overview

El wizard se implementa como composición de mutations incrementales sobre una misma remesa `DRAFT`, reutilizando el patrón actual de remittances (resolver + use-case + ports + adapters), `GqlAuthGuard` y validación de ownership por `senderUserId`.

No se rompe el modelo vigente: se preserva `amount`/`beneficiaryId` como `NOT NULL` y default Prisma de `status=SUBMITTED`.
Para iniciar wizard sin tocar nullability/defaults, la creación de draft persistirá `status=DRAFT` explícito y `amount` inicial válido.

## Data Model (minimal)

### Existing fields reused

- `Remittance.id`
- `Remittance.senderUserId`
- `Remittance.beneficiaryId`
- `Remittance.amount`
- `Remittance.status`
- `originAccountType`, `originZelleEmail`, `originIban`, `originStripePaymentMethodId`

### New Prisma enums

- `ReceptionMethod`
  - `USD_CASH`
  - `CUP_CASH`
  - `CUP_TRANSFER`
  - `MLC`
  - `USD_CLASSIC`

- `OriginAccountHolderType`
  - `PERSON`
  - `COMPANY`

### New Prisma fields in `Remittance`

- `receptionMethod ReceptionMethod?`
- `destinationCupCardNumber String?`
- `originAccountHolderType OriginAccountHolderType?`
- `originAccountHolderFirstName String?`
- `originAccountHolderLastName String?`
- `originAccountHolderCompanyName String?`

Rationale:
- Campos opcionales para soportar completion progresiva del wizard.
- Reglas de obligatoriedad se aplican en use-cases y en `submitRemittance`.

## GraphQL Contract (minimal)

### Enums nuevos

- `ReceptionMethod`
- `OriginAccountHolderType`

### Mutations nuevas

- `createRemittanceDraft(beneficiaryId: ID!): ID!`
- `setRemittanceReceptionMethod(input: SetRemittanceReceptionMethodInput!): Boolean!`
- `setRemittanceDestinationCupCard(input: SetRemittanceDestinationCupCardInput!): Boolean!`
- `setRemittanceOriginAccountHolder(input: SetRemittanceOriginAccountHolderInput!): Boolean!`
- `submitRemittance(remittanceId: ID!): Boolean!`

Todas protegidas con `GqlAuthGuard`.

### Inputs nuevos

- `SetRemittanceReceptionMethodInput`
  - `remittanceId: ID!`
  - `receptionMethod: ReceptionMethod!`

- `SetRemittanceDestinationCupCardInput`
  - `remittanceId: ID!`
  - `destinationCupCardNumber: String!`

- `SetRemittanceOriginAccountHolderInput`
  - `remittanceId: ID!`
  - `holderType: OriginAccountHolderType!`
  - `firstName: String`
  - `lastName: String`
  - `companyName: String`

## Use-case Rules

### createRemittanceDraft

- valida ownership del `beneficiaryId` (beneficiario del usuario autenticado).
- crea remesa con:
  - `status = DRAFT` explícito.
  - `amount = REMITTANCE_AMOUNT_MIN` (o default configurado en RF-013).
  - `currency` por default actual del modelo.
- retorna `remittanceId`.

### setRemittanceReceptionMethod (RF-014)

- valida remesa propia.
- valida estado `DRAFT`.
- persiste método.
- si método != `CUP_TRANSFER`, limpia `destinationCupCardNumber`.

### setRemittanceDestinationCupCard (RF-015)

- valida remesa propia y `DRAFT`.
- exige que `receptionMethod = CUP_TRANSFER`.
- valida formato básico no vacío y persiste tarjeta.

### setRemittanceOriginAccountHolder (RF-016)

- valida remesa propia y `DRAFT`.
- `PERSON` => `firstName` y `lastName` obligatorios; `companyName` debe quedar `null`.
- `COMPANY` => `companyName` obligatorio; `firstName/lastName` deben quedar `null`.

### submitRemittance (RF-017)

Validaciones acumuladas:
- ownership por `senderUserId`.
- `status == DRAFT`.
- monto dentro de min/max (reuse RF-013).
- cuenta origen seteada y coherente (reuse RF-012).
- `receptionMethod` seteado.
- titular seteado y válido.
- si `CUP_TRANSFER`, `destinationCupCardNumber` requerido.

Efectos:
- actualiza `Remittance.status = SUBMITTED`.
- crea `Transfer` con `status = PENDING` si no existe (`upsert`/guard transaccional).
- retorna `true`.

## Error semantics

- `NotFoundDomainException`: remesa no existe o no pertenece al usuario.
- `ValidationDomainException`: estado inválido, datos incompletos, reglas de tipo/condición incumplidas.
- Mensajes alineados al patrón vigente del módulo.