# Design: enum-to-string-contract (CLOSED)

## Design Compliance Status

Diseño respetado completamente y sin desviaciones de alcance.

## Implemented Design

Se implementó el desacople contract-first y type-cleanup definido:

- input GraphQL `originAccountType` migrado a `String!`
- nombre del campo preservado (`originAccountType`)
- tipado interno migrado a `originAccountType: string`
- enum huérfano `OriginAccountType` eliminado de Prisma schema

## Validation Logic Status

Se preservó la lógica hardcodeada para los tipos soportados:

- `ZELLE` -> requiere `zelleEmail`
- `IBAN` -> requiere `iban`
- `STRIPE` -> requiere `stripePaymentMethodId`

Se aplicó la corrección del bug de branching:

- no existe else implícito a STRIPE
- código no soportado retorna error explícito (`originAccountType is not supported`)

## Persistence Status

La persistencia de remesas quedó sin cambios estructurales:

- `paymentMethodId` se mantiene como referencia real
- se mantienen `originZelleEmail`, `originIban`, `originStripePaymentMethodId`
- no se agregó columna nueva para `originAccountType`

## Prisma Cleanup Status

- `OriginAccountType` removido de `schema.prisma`
- migración de cleanup creada/aplicada
- sin migración de datos de remesas, porque no existían columnas activas usando ese enum

## Scope Guardrail Confirmation

Fuera de alcance respetado:

- sin refactor data-driven
- sin uso de `PaymentMethod.additionalData`
- sin rename a `paymentMethodCode`
- sin cambios en pricing/comisión
- sin cambios en manual beneficiary visibility
- sin cambios en destination field rename
- sin cambios en auth/JWT/guards