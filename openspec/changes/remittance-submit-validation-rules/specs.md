# Specs: remittance-submit-validation-rules (IMPLEMENTADO Y VALIDADO)

## Acceptance criteria (Todos cumplidos)

### ✓ AC-1: transfer methods require destinationCupCardNumber

Cuando `submitRemittanceV2` resuelve un método de recepción cuyo `ReceptionMethodCatalog.method === TRANSFER`, la solicitud requiere `destinationCupCardNumber`.

**Evidencia:** `CUP_TRANSFER` sin campo falla con error esperado ✓

### ✓ AC-2: cash methods do not require destinationCupCardNumber

Cuando `submitRemittanceV2` resuelve un método de recepción cuyo `ReceptionMethodCatalog.method === CASH`, la solicitud no requiere `destinationCupCardNumber`.

**Evidencia:** `USD_CASH` sin campo no falla por esta validación ✓

### ✓ AC-3: validation no longer depends exclusively on CUP_TRANSFER

La validación deja de depender exclusivamente del enum `CUP_TRANSFER` y se basa en `ReceptionMethodCatalog.method`.

**Evidencia:** `MLC` sin campo falla por la misma regla que `CUP_TRANSFER`, basada en method === TRANSFER ✓

### ✓ AC-4: CUP_TRANSFER still works through catalog configuration

`CUP_TRANSFER` funciona con la nueva validación porque su configuración actual de catálogo resuelve `method === TRANSFER`.

**Evidencia:** `CUP_TRANSFER` sin `destinationCupCardNumber` falla con mensaje de TRANSFER, no con lógica hardcodeada ✓

### ✓ AC-5: no Prisma changes

Este change no modificó Prisma schema ni migraciones.

**Evidencia:** Sin cambios en src/prisma/schema.prisma ✓

### ✓ AC-6: GraphQL remains consistent

El proyecto compila y `src/schema.gql` se mantiene consistente con el contrato actual.

**Evidencia:** `npm run build` OK, `PORT=3001 npm run start:dev` OK ✓

## Test scenarios validados

### ✓ Scenario 1: CUP_TRANSFER requires destinationCupCardNumber

- Given método `CUP_TRANSFER` (method === TRANSFER)
- When `destinationCupCardNumber` no es enviado
- Then falla: `destinationCupCardNumber is required for TRANSFER reception methods` ✓

### ✓ Scenario 2: MLC requires destinationCupCardNumber

- Given método `MLC` (method === TRANSFER)
- When `destinationCupCardNumber` no es enviado
- Then falla: `destinationCupCardNumber is required for TRANSFER reception methods` ✓

### ✓ Scenario 3: USD_CASH does not require destinationCupCardNumber

- Given método `USD_CASH` (method === CASH)
- When `destinationCupCardNumber` no es enviado
- Then no falla por esta validación ✓

### ✓ Scenario 4: CUP_CASH accepts destinationCupCardNumber if provided

- Given método `CUP_CASH` (method === CASH)
- When `destinationCupCardNumber = '1234567890123456'` es enviado
- Then remesa creada exitosamente, no falla por presencia del campo ✓

## Guardrails

- No renombrar `destinationCupCardNumber`.
- No tocar persistencia.
- No tocar Prisma schema.
- No mezclar este change con otros pedidos de frontend.
- No incluir cambios en `manualBeneficiary`, pricing o `originAccountType`.