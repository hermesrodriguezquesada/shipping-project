# Design: remittance manual beneficiary visibility control

## Scope

In scope:
- `SubmitRemittanceV2Input.saveManualBeneficiary`.
- Nuevo control de visibilidad en `Beneficiary`.
- Persistencia de beneficiary manual como visible u oculto según flag.
- Filtro de listados del usuario para mostrar solo beneficiaries visibles.
- Mantener sin cambios la relación actual entre `Remittance` y `Beneficiary`.

Out of scope:
- `Remittance.beneficiaryId` nullable.
- `RemittanceType.beneficiary` nullable.
- Cambios en snapshot `recipient`.
- pricing/comisión, `originAccountType`, rename `destinationCupCardNumber`, auth/JWT/guards, favoritos avanzados, refactors generales.

## Core decision

La solución aprobada mantiene el modelo actual de remesa:

- `Remittance.beneficiaryId` sigue siendo obligatorio.
- El camino `manualBeneficiary` sigue creando `Beneficiary`.
- El cambio funcional consiste en controlar si ese `Beneficiary` aparece o no en la libreta del usuario.

## GraphQL input change

### SubmitRemittanceV2Input

Agregar campo opcional:
- `saveManualBeneficiary: Boolean`

Semántica:
- `true`: beneficiary manual visible al usuario.
- `false`: beneficiary manual oculto en libreta/listados.
- `undefined`: tratar como `true` por compatibilidad hacia atrás.

La regla XOR actual se mantiene igual:
- exactamente uno entre `beneficiaryId` y `manualBeneficiary`.

## Beneficiary model change

Agregar campo nuevo en Prisma para `Beneficiary`:
- `isVisibleToOwner Boolean @default(true)`

Responsabilidad del campo:
- controlar si el registro debe aparecer en `myBeneficiaries` y queries equivalentes de libreta.
- no afecta la validez de la relación de remesa ni la lectura de remesas existentes.

## Ownership vs visibility

`isVisibleToOwner` solo controla la presencia del beneficiary en listados/libreta del usuario.

No cambia ownership ni validez interna del registro:
- el beneficiary oculto sigue perteneciendo al usuario
- puede seguir sosteniendo relaciones de remesa existentes
- no debe tratarse como registro inválido o huérfano

## submitRemittanceV2 write-path

1. Mantener validación XOR exacta entre `beneficiaryId` y `manualBeneficiary`.
2. Camino `beneficiaryId`:
   - no cambia comportamiento.
3. Camino `manualBeneficiary`:
   - seguir creando `Beneficiary` como hoy,
   - setear `isVisibleToOwner` según `saveManualBeneficiary`,
   - si el flag no viene informado, persistir `isVisibleToOwner = true`,
   - continuar creando la remesa con `beneficiaryId` obligatorio apuntando al beneficiary recién creado.

## User beneficiary listings

Las consultas/listados de libreta del usuario deben filtrar por visibilidad:
- `myBeneficiaries` devuelve solo registros con `isVisibleToOwner = true`.
- cualquier query equivalente de libreta del usuario debe aplicar el mismo criterio.

Esto permite que beneficiaries ocultos sigan existiendo para sostener remesas, sin exponerse como elementos de libreta.

## Remittance read behavior

No cambia el comportamiento de lectura de remesas:
- las remesas siguen teniendo `beneficiaryId`.
- `RemittanceType.beneficiary` sigue resolviéndose normalmente.
- no hay cambios de nullability ni de contrato para remittances.

## Affected surfaces

- Prisma schema y migración para `Beneficiary.isVisibleToOwner`.
- `SubmitRemittanceV2Input` en GraphQL code-first.
- `SubmitRemittanceV2UseCase` y create path de beneficiary manual.
- Query/adapter/resolver de `myBeneficiaries` o equivalente.
- `schema.gql` generado para verificar el nuevo input.

## Compatibility and risk control

- El comportamiento actual se preserva cuando `saveManualBeneficiary` no se envía.
- Se evita el riesgo de volver nullable la FK de remesa.
- Se evita ampliar el impacto de contrato sobre `RemittanceType.beneficiary`.
- No se tocan pricing, `originAccountType`, destination rename, auth o contratos no relacionados.