# Proposal: remittance-submit-validation-rules (CLOSED)

## Problem statement (Resuelto)

Hoy `submitRemittanceV2` aplicaba una validación hardcodeada sobre `destinationCupCardNumber` basada únicamente en `receptionMethod === CUP_TRANSFER`:

- el campo era obligatorio cuando el método era `CUP_TRANSFER`
- el campo estaba prohibido cuando el método no era `CUP_TRANSFER`

Esa lógica quedaba demasiado específica para un único enum y no representaba correctamente el comportamiento esperado por frontend ni el modelo actual de catálogo.

## Solución implementada y validada

La validación fue actualizada para dejar de depender exclusivamente de `CUP_TRANSFER` y basarse en `ReceptionMethodCatalog.method` como fuente de verdad.

### Regla nueva en efecto

- Si `method === TRANSFER`: `destinationCupCardNumber` es obligatorio
- Si `method === CASH`: `destinationCupCardNumber` no es obligatorio y su presencia no es rechazada

### Validación en ambiente de desarrollo

**TRANSFER sin destinationCupCardNumber** (Falla como esperado)
- `CUP_TRANSFER`: error `destinationCupCardNumber is required for TRANSFER reception methods` ✓
- `MLC`: error `destinationCupCardNumber is required for TRANSFER reception methods` ✓

**CASH con destinationCupCardNumber** (No falla por presencia, como esperado)
- `CUP_CASH`: remesa creada exitosamente ✓

**CASH sin destinationCupCardNumber** (No falla por validación de este change, como esperado)
- `USD_CASH`: no falla por esta validación, avanza hasta regla posterior ✓

## Estado final

✔ Problema resuelto
✔ Validación basada en `ReceptionMethodCatalog.method`
✔ Casos funcionales probados
✔ Alcance respetado (sin cambios en Prisma, migraciones, rename ni otras funcionalidades)
✔ Build y runtime operativo
✔ schema.gql consistente

## Explicit non-goals

Este change no toca:

- persistencia ni Prisma schema
- migraciones
- renombre del campo `destinationCupCardNumber`
- contrato GraphQL del campo, salvo ajuste mínimo estrictamente necesario
- `manualBeneficiary`
- pricing/comisiones
- `originAccountType`
- outputs GraphQL existentes
- refactors