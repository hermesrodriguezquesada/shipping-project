# Specs: remittance manual beneficiary visibility control

## Scope of behavior

`submitRemittanceV2` mantiene exactamente dos modos de destinatario:
- modo A: `beneficiaryId`
- modo B: `manualBeneficiary`

La regla XOR se mantiene sin cambios:
- uno y solo uno entre `beneficiaryId` y `manualBeneficiary`.

## Acceptance criteria

### submit manual

- AC-1: Si `manualBeneficiary` llega con `saveManualBeneficiary = true`, el `Beneficiary` creado queda visible en la libreta del usuario.
- AC-2: Si `manualBeneficiary` llega con `saveManualBeneficiary = false`, el `Beneficiary` creado no aparece en la libreta del usuario.
- AC-3: Si `saveManualBeneficiary` no se envía, el comportamiento efectivo equivale a visible (`true`).
- AC-4: La remesa sigue creándose correctamente en los casos manual visible, manual oculto y manual sin flag.
- AC-5: El flujo existente con `beneficiaryId` sigue funcionando igual.
- AC-6: Se mantiene la regla XOR exacta entre `beneficiaryId` y `manualBeneficiary`.

### persistencia y listados

- AC-7: `Beneficiary` incorpora un campo de visibilidad con default `true`.
- AC-8: `myBeneficiaries` y listados equivalentes del usuario solo devuelven beneficiaries visibles.
- AC-9: Las remittances siguen devolviendo `beneficiary` normalmente, sin cambios de nullability ni ruptura de contrato.
- AC-10: Prisma migration y schema reflejan el nuevo campo de visibilidad.
- AC-10.1: Beneficiaries existentes siguen visibles por defecto. Los beneficiaries ya existentes antes de la migración continúan apareciendo en `myBeneficiaries`, salvo que explícitamente se marque lo contrario en el nuevo campo de visibilidad.
- AC-11: Build y validación code-first se completan correctamente, con `schema.gql` alineado al nuevo input.

## Contract expectations

### SubmitRemittanceV2Input

- `beneficiaryId` mantiene la semántica actual dentro de la regla XOR.
- `manualBeneficiary` mantiene la semántica actual dentro de la regla XOR.
- `saveManualBeneficiary` es opcional.
- Si `saveManualBeneficiary` no viene, el comportamiento equivale a `true`.

### RemittanceType

- `beneficiary` sigue disponible normalmente.
- No cambia nullability ni estrategia de lectura de remesas.

## Test scenarios

1. Submit manual visible:
- `manualBeneficiary` presente,
- `saveManualBeneficiary = true`,
- se crea remesa,
- se crea `Beneficiary` asociado,
- el nuevo beneficiary aparece en `myBeneficiaries`.

2. Submit manual oculto:
- `manualBeneficiary` presente,
- `saveManualBeneficiary = false`,
- se crea remesa,
- se crea `Beneficiary` asociado,
- el nuevo beneficiary no aparece en `myBeneficiaries`.

3. Submit manual sin flag:
- `manualBeneficiary` presente,
- `saveManualBeneficiary` ausente,
- se crea remesa,
- se crea `Beneficiary` asociado,
- el beneficiary aparece en `myBeneficiaries`.

4. Lectura de libreta antes/después:
- beneficiaries visibles siguen listándose,
- beneficiaries ocultos no se listan,
- la query no falla por existencia de registros ocultos.

5. Remesa creada sigue consultable:
- remesa manual visible u oculta sigue recuperable,
- `beneficiary` sigue resolviéndose normalmente,
- no hay ruptura del contrato de remittance.

6. Validación XOR:
- ambos campos ausentes => error de validación.
- ambos campos presentes => error de validación.