# Proposal: enum-to-string-contract (CLOSED)

## Final Status

Change implementado, validado y acotado al alcance aprobado.

## Problem Resolved

Se resolvió el desacople entre contrato/tipos internos y el enum rígido `OriginAccountType`.

Estado final:

- `SubmitRemittanceV2OriginAccountInput.originAccountType` usa `String!`.
- El nombre del campo se mantiene: `originAccountType`.
- Las capas internas del flujo submit usan `originAccountType: string`.
- El enum huérfano `OriginAccountType` fue eliminado de Prisma schema.

## Persistence Confirmation

La persistencia real de remesas no cambió estructuralmente:

- se mantiene `paymentMethodId`
- se mantienen `originZelleEmail`, `originIban`, `originStripePaymentMethodId`
- no se agregó columna nueva para `originAccountType`

## Behavior Confirmation

Se preservó la validación hardcodeada para métodos soportados:

- `ZELLE` requiere `zelleEmail`
- `IBAN` requiere `iban`
- `STRIPE` requiere `stripePaymentMethodId`

Y se corrigió el bug del else implícito:

- códigos no soportados fallan explícitamente
- ejemplo validado: `ACH` -> `originAccountType is not supported`

## Breaking Contract Note

Cambio de contrato aplicado:

- antes: `OriginAccountType!`
- después: `String!`

Sin ampliación funcional en este change. Los valores soportados permanecen:

- `"ZELLE"`
- `"IBAN"`
- `"STRIPE"`

## Scope Guardrail Confirmation

Este cierre confirma que NO se implementó todavía la fase data-driven:

- no se usó `PaymentMethod.additionalData`
- no se renombró a `paymentMethodCode`
- no se abrió cambio de validación por catálogo

## Validation Summary

- `npm run build`: OK
- `PORT=3001 npm run start:dev`: OK
- `schema.gql`: regenerado y alineado (`originAccountType: String!` en input)
- smoke tests submit: OK