# Tasks: remittance-submit-validation-rules (COMPLETADO)

1. Review current remittance submit validation
- [x] Revisado `submit-remittance-v2.usecase.ts`: validación hardcodeada por `CUP_TRANSFER` identificada
- [x] Confirmado el punto donde se resuelve `ReceptionMethodCatalog.method` en el adapter de availability

2. Adjust validation behavior
- [x] Actualizada la validación de `destinationCupCardNumber` para requerirlo cuando `method === TRANSFER`
- [x] Actualizada para que no sea obligatorio cuando `method === CASH`
- [x] Eliminada la dependencia exclusiva de `CUP_TRANSFER` (línea 151 del use case reemplazada)

3. Preserve current contract boundaries
- [x] Input actual `destinationCupCardNumber` mantiene su nombre (sin rename)
- [x] Sin cambios en persistencia ni Prisma schema
- [x] Sin cambios en migraciones
- [x] `manualBeneficiary`, pricing y `originAccountType` intactos

4. Update verification coverage
- [x] Agregada spec unitaria: submit-remittance-v2.usecase.spec.ts con 4 smoke tests
- [x] Validado comportamiento TRANSFER (CUP_TRANSFER, MLC)
- [x] Validado comportamiento CASH (CUP_CASH, USD_CASH)

5. Validate build and runtime contract
- [x] `npm run build`: OK
- [x] `PORT=3001 npm run start:dev`: OK
- [x] `src/schema.gql`: consistente, sin cambios fuera de alcance

## Validación en ambiente de desarrollo

- [x] TRANSFER sin destinationCupCardNumber: falla con mensaje correcto
- [x] CASH sin destinationCupCardNumber: no falla por esta validación
- [x] CASH con destinationCupCardNumber: no falla por presencia del campo
- [x] Alcance respetado, sin desviaciones

## Estado final del change

✔ Implementado
✔ Validado
✔ Acotado
✔ Listo para merge