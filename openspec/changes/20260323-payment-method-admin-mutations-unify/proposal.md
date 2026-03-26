# Proposal: Unify Payment Method Admin Mutations (Closed)

## Final Status

Este change está **resuelto e implementado** según el alcance aprobado.

## Problem Resolved

Se resolvió el problema original de tener dos mutaciones separadas para el mismo recurso (`PaymentMethod`) cuando se necesitaba actualizar `description` y `additionalData` en una sola operación.

## Delivered Outcome

Se agregó la nueva mutación:

- `adminUpdatePaymentMethod(input: AdminUpdatePaymentMethodInput!): PaymentMethodType!`

con el input:

- `code` requerido
- `description` opcional
- `additionalData` opcional

y con validación de negocio implementada:

- si no llega ninguno de los campos actualizables, falla con:
	- `At least one of description or additionalData must be provided`

## Validation Evidence (Summary)

- `npm run build`: OK
- `PORT=3001 npm run start:dev`: OK
- `src/schema.gql`: actualizado con nueva mutación e input
- Prueba funcional validada con `code: "ZELLE"`, `description`, `additionalData` y respuesta esperada
- Casos funcionales validados:
	- solo `description`
	- solo `additionalData`
	- ambos campos
	- `code` inexistente (not found)
	- sin campos actualizables (validation error)

## Backward Compatibility Confirmation

Se preservó compatibilidad hacia atrás:

- `adminUpdatePaymentMethodDescription` sigue disponible
- `adminUpdatePaymentMethodAdditionalData` sigue disponible

No hubo breaking change en este scope.

## Scope Compliance

- Sin cambios en Prisma schema
- Sin migraciones
- Sin cambios en auth/guards
- Sin cambios en módulos fuera de alcance