# Proposal: remittance manual beneficiary visibility control

## Problem statement

Hoy `submitRemittanceV2` acepta `manualBeneficiary`, pero ese camino siempre termina creando un `Beneficiary` que queda reflejado en la libreta/listado del usuario.

Consecuencia: frontend no puede decidir si el destinatario manual debe quedar visible como parte de la libreta o si solo debe existir para soportar la remesa.

## Frontend need

Cuando se use `manualBeneficiary` en `submitRemittanceV2`, frontend debe poder indicar explícitamente si ese beneficiary manual queda visible en la libreta del usuario.

## Expected outcome

- El submit manual sigue creando la remesa correctamente.
- El camino manual sigue creando `Beneficiary` para sostener la relación actual de remesa.
- Frontend puede decidir si ese `Beneficiary` queda visible u oculto en listados del usuario.
- Los listados de libreta devuelven solo beneficiaries visibles.
- El flujo existente con `beneficiaryId` no cambia.

## Explicit persistence decision

Este change mantiene la estrategia actual de persistencia de remesas:

- `Remittance.beneficiaryId` se mantiene obligatorio.
- `RemittanceType.beneficiary` no cambia a nullable.
- No se cambia la estrategia de lectura de remesas ni el contrato histórico actual.

El control nuevo se implementa en el modelo `Beneficiary`, no en la relación de `Remittance`.

## Backward compatibility

Se agrega `saveManualBeneficiary` como campo opcional en `SubmitRemittanceV2Input`.

Semántica efectiva:
- `true`: el beneficiary manual queda visible en la libreta.
- `false`: el beneficiary manual no aparece en listados de libreta.
- ausente: equivale a `true` para conservar el comportamiento actual.

## Non-goals

- No volver nullable `Remittance.beneficiaryId`.
- No volver nullable `RemittanceType.beneficiary`.
- No cambiar `recipient` snapshot strategy.
- Fuera de alcance: pricing/comisión, `originAccountType`, rename de `destinationCupCardNumber`, auth/JWT/guards, favoritos avanzados y refactors generales.
