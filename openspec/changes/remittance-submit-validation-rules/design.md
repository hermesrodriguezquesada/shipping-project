# Design: remittance-submit-validation-rules (CLOSED - Respetado completamente)

## Validation source of truth (Implementado)

La validación de `destinationCupCardNumber` en `submitRemittanceV2` ya no depende de una comparación hardcodeada contra `CUP_TRANSFER` y ahora usa el valor resuelto de `ReceptionMethodCatalog.method`.

La decisión de validación está basada en el tipo operativo del método de recepción:

- `TRANSFER`
- `CASH`

## Validation rules (Implementadas)

### TRANSFER

Si el método de recepción resuelto tiene `method === TRANSFER`:

- `destinationCupCardNumber` es obligatorio

Esto cubre `CUP_TRANSFER` y también otros métodos de recepción configurados como transferencia (`MLC`, `USD_CLASSIC`).

**Evidencia de implementación:**
- `CUP_TRANSFER` sin `destinationCupCardNumber`: falla con mensaje correcto ✓
- `MLC` sin `destinationCupCardNumber`: falla con mensaje correcto ✓

### CASH

Si el método de recepción resuelto tiene `method === CASH`:

- `destinationCupCardNumber` no es obligatorio
- su presencia no es rechazada por esta validación

La lógica anterior que lo prohibía fue eliminada.

**Evidencia de implementación:**
- `CUP_CASH` con `destinationCupCardNumber`: remesa creada exitosamente ✓
- `USD_CASH` sin `destinationCupCardNumber`: no falla por esta validación ✓

## Contract and persistence boundaries

- No hay cambios en Prisma schema.
- No hay cambios en migraciones.
- `destinationCupCardNumber` mantiene su nombre actual.
- No se introduce todavía ningún rename hacia `destinationAccountNumber`.
- El contrato GraphQL actual se mantiene, salvo ajuste mínimo estrictamente necesario para preservar consistencia de validación/compilación.

## Impact boundaries

Este change se limita a la validación de submit de remesas y sus pruebas.

No impacta:

- pricing
- comisión/delivery fees
- `manualBeneficiary`
- `originAccountType`
- persistencia de remesas
- outputs GraphQL existentes

## Verification intent

La implementación deberá demostrar que:

- la regla se evalúa por `ReceptionMethodCatalog.method`
- `TRANSFER` requiere `destinationCupCardNumber`
- `CASH` no lo requiere
- la presencia del campo en métodos `CASH` no es rechazada por esta validación
- `CUP_TRANSFER` sigue siendo válido por su configuración actual de catálogo, no por una excepción hardcodeada