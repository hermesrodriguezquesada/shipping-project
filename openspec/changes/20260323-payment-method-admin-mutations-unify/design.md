# Design: Unify Payment Method Admin Mutations (Closed)

## Design Compliance Status

Diseño **respetado completamente** y aplicado sin desviaciones de alcance.

## Implemented Design

Se implementó la mutación unificada:

```graphql
adminUpdatePaymentMethod(input: AdminUpdatePaymentMethodInput!): PaymentMethodType!
```

con input:

- `code` requerido
- `description` opcional
- `additionalData` opcional

## Behavior Confirmed

- Solo `description`: actualiza `description` y preserva `additionalData`
- Solo `additionalData`: actualiza `additionalData` y preserva `description`
- Ambos: actualiza ambos campos en la misma operación lógica
- Ninguno: error de validación con mensaje esperado
- `code` inexistente: error not found

## Coexistence With Legacy Mutations

La nueva mutación convive con las mutaciones legacy, sin cambios de contrato ni comportamiento en:

- `adminUpdatePaymentMethodDescription`
- `adminUpdatePaymentMethodAdditionalData`

## No-Deviation / No-Impact Confirmation

- Sin cambios en Prisma schema
- Sin migraciones
- Sin refactors fuera de alcance
- Sin cambios en otros módulos