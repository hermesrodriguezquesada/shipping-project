# Design: remittance recipient snapshot and inline beneficiary create

## Scope

- Prisma: snapshot de recipient en `Remittance` + migración con backfill.
- GraphQL: nuevo `RemittanceRecipientType`, nuevo `ManualBeneficiaryInput`, ajuste de `SubmitRemittanceV2Input`.
- Application: `SubmitRemittanceV2UseCase` soporta beneficiary seleccionado o manual, crea beneficiary cuando aplique y siempre persiste snapshot + beneficiaryId.
- Read path: `RemittanceType.recipient` sale de columnas snapshot (no de join vivo).

## Prisma schema changes

### Remittance (new recipient snapshot columns)

Required (NOT NULL al finalizar migración):
- `recipientFullName String`
- `recipientPhone String`
- `recipientCountry String`
- `recipientAddressLine1 String`
- `recipientDocumentNumber String`

Optional:
- `recipientEmail String?`
- `recipientCity String?`
- `recipientAddressLine2 String?`
- `recipientPostalCode String?`
- `recipientDocumentType DocumentType?`
- `recipientRelationship BeneficiaryRelationship?`
- `recipientDeliveryInstructions String?`

### Backfill migration plan

1. Agregar columnas snapshot como nullable.
2. Backfill con join `Remittance.beneficiaryId -> Beneficiary.id`.
3. Validar que columnas requeridas no queden null.
4. Elevar a NOT NULL en requeridas.

Si hay filas que no se pueden backfillear, migración debe fallar explícitamente.

## GraphQL contract changes

### New input type

`ManualBeneficiaryInput` alineado con campos de creación de beneficiario:
- Requeridos: `fullName`, `phone`, `country`, `addressLine1`, `documentNumber`
- Opcionales: `email`, `city`, `addressLine2`, `postalCode`, `documentType`, `relationship`, `deliveryInstructions`

### Update SubmitRemittanceV2Input

- `beneficiaryId` pasa de requerido a opcional.
- se añade `manualBeneficiary` opcional.
- Regla de validación: exactamente uno (`beneficiaryId` XOR `manualBeneficiary`).

### New output type

`RemittanceRecipientType` con snapshot fields de recipient.

### Update RemittanceType

- Añadir `recipient: RemittanceRecipientType!`.
- Mantener `beneficiary: BeneficiaryType!` sin cambios para compatibilidad.

## Write-path logic (submitRemittanceV2)

1. Validar regla XOR (`beneficiaryId`, `manualBeneficiary`).
2. Branch A (`beneficiaryId`):
   - verificar ownership (`beneficiaryBelongsToUser` / fetch by id + owner),
   - cargar beneficiario,
   - usarlo para snapshot.
3. Branch B (`manualBeneficiary`):
   - crear `Beneficiary` owned by sender con defaults actuales (`isFavorite=false`, `isDeleted=false`),
   - usar beneficiario creado para snapshot.
4. Continuar lógica existente de pricing/lifecycle sin alteraciones.
5. Persistir remesa con:
   - `beneficiaryId` siempre seteado,
   - columnas snapshot recipient siempre seteadas.

## Read-path changes

- Adaptador/query read model de remesas debe exponer snapshot fields nuevos.
- Resolver de remesas debe mapear `recipient` desde snapshot columns.
- `beneficiary` puede continuar resolviéndose desde join actual (compatibilidad), pero no será fuente histórica recomendada.

## Affected files (implementation target)

- `src/prisma/schema.prisma`
- `src/prisma/migrations/<new_migration>/migration.sql`
- `src/modules/remittances/presentation/graphql/inputs/submit-remittance-v2.input.ts`
- `src/modules/remittances/presentation/graphql/types/remittance.type.ts`
- `src/modules/remittances/presentation/graphql/types/remittance-recipient.type.ts` (new)
- `src/modules/remittances/application/use-cases/submit-remittance-v2.usecase.ts`
- `src/modules/remittances/domain/ports/remittance-command.port.ts`
- `src/modules/remittances/domain/ports/remittance-query.port.ts`
- `src/modules/remittances/infrastructure/adapters/prisma-remittance-command.adapter.ts`
- `src/modules/remittances/infrastructure/adapters/prisma-remittance-query.adapter.ts`
- `src/modules/remittances/presentation/graphql/resolvers/remittances.resolver.ts`

## Out of scope

- Auth/guards.
- Pricing formulas y lifecycle transitions.
- Refactors de módulos no relacionados.
- Eliminación de `beneficiary` existente en `RemittanceType`.
