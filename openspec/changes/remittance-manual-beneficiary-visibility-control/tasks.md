# Tasks: remittance manual beneficiary visibility control

## 1) GraphQL input

- [ ] Agregar `saveManualBeneficiary` a `SubmitRemittanceV2Input` como campo opcional.
- [ ] Verificar que el contrato code-first preserve compatibilidad cuando el flag no se envía.

## 2) Prisma model and migration

- [ ] Agregar `isVisibleToOwner` a `Beneficiary` en Prisma con default `true`.
- [ ] Crear migración para el nuevo campo.
- [ ] Validar que registros existentes queden visibles por defecto y sin regresión funcional.

## 3) submitRemittanceV2 manual path

- [ ] Ajustar flujo manual de `submitRemittanceV2` para leer `saveManualBeneficiary`.
- [ ] Mantener la regla XOR exacta entre `beneficiaryId` y `manualBeneficiary`.
- [ ] Ajustar creación de `Beneficiary` manual para setear `isVisibleToOwner` según el flag.
- [ ] Si el flag no viene informado, persistir el comportamiento equivalente a visible (`true`).
- [ ] Mantener intacto el flujo existente cuando se usa `beneficiaryId`.

## 4) User listings

- [ ] Ajustar `myBeneficiaries` o query equivalente para filtrar solo `isVisibleToOwner = true`.
- [ ] Confirmar que listados/libreta equivalentes del usuario aplican el mismo criterio cuando corresponda.

## 5) Remittance compatibility

- [ ] Verificar que `Remittance.beneficiaryId` permanezca obligatorio.
- [ ] Verificar que `RemittanceType.beneficiary` permanezca no nullable.
- [ ] Confirmar que no cambie la lectura de remesas ni su contrato actual.

## 6) Validation

- [ ] Ejecutar `npm run build`.
- [ ] Ejecutar `PORT=3001 npm run start:dev` y validar arranque.
- [ ] Revisar `schema.gql` para confirmar `saveManualBeneficiary` en `SubmitRemittanceV2Input`.

## 7) Smoke tests

- [ ] Smoke test de submit manual visible.
- [ ] Smoke test de submit manual oculto.
- [ ] Smoke test de submit manual sin flag.
- [ ] Smoke test de libreta/listado filtrado por visibilidad.
- [ ] Smoke test de remesa creada sin ruptura de contrato y con `beneficiary` asociado.

## 8) Guardrails

- [ ] No usar enfoque de `beneficiaryId` nullable.
- [ ] No volver nullable `RemittanceType.beneficiary`.
- [ ] No cambiar snapshot `recipient`.
- [ ] No incluir cambios de pricing/comisión.
- [ ] No incluir cambios de `originAccountType`.
- [ ] No incluir rename de `destinationCupCardNumber`.
- [ ] No incluir cambios de auth/JWT/guards.
- [ ] No mezclar este change con otros pedidos del frontend.
